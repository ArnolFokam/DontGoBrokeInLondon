import { AUDIT_CHECKS, type AuditCheckDefinition } from "@/lib/audit-checks";
import { getAuditCopy } from "@/lib/audit-copy";
import {
  completeAuditRun,
  createAuditRun,
  failAuditRun,
  saveAuditCheckResult,
} from "@/lib/audit-report";
import { getAuditToolData } from "@/lib/audit-tools";
import type {
  AuditCheckResult,
  AuditPhase,
  AuditRating,
  AuditStreamEvent,
} from "@/lib/audit-types";

type EmitAuditEvent = (event: AuditStreamEvent) => void | Promise<void>;

type ToolData = Awaited<ReturnType<typeof getAuditToolData>>;

const phaseWeights: Record<AuditPhase, number> = {
  querying_data: 0.15,
  cursor_reasoning: 0.45,
  scoring: 0.75,
  saving: 0.92,
};

export async function runAuditWorkflow({
  uploadId,
  emit,
}: {
  uploadId: string;
  emit: EmitAuditEvent;
}) {
  const auditRunId = await createAuditRun(uploadId);
  const results: AuditCheckResult[] = [];

  try {
    await emit({
      type: "audit_started",
      auditRunId,
      totalChecks: AUDIT_CHECKS.length,
      progress: 0,
      quote: getAuditCopy({ index: 0 }),
    });

    for (const [index, check] of AUDIT_CHECKS.entries()) {
      const checkIndex = index + 1;
      await emit({
        type: "check_started",
        checkId: check.id,
        title: check.title,
        checkIndex,
        totalChecks: AUDIT_CHECKS.length,
        progress: progressFor(index, 0),
        quote: getAuditCopy({ checkId: check.id, index }),
      });

      await emitProgress({ emit, check, index, phase: "querying_data" });
      const data = await getAuditToolData(uploadId);

      await emitProgress({ emit, check, index, phase: "cursor_reasoning" });
      const result = await runCursorCheck(check, data);

      await emitProgress({ emit, check, index, phase: "scoring" });
      const normalizedResult = normalizeResult(check, result);

      await emitProgress({ emit, check, index, phase: "saving" });
      await saveAuditCheckResult({
        auditRunId,
        uploadId,
        result: normalizedResult,
      });

      results.push(normalizedResult);

      await emit({
        type: "check_completed",
        result: normalizedResult,
        checkIndex,
        totalChecks: AUDIT_CHECKS.length,
        progress: progressFor(index + 1, 0),
        quote: getAuditCopy({ checkId: check.id, index: checkIndex }),
      });
    }

    const overallScore = Math.round(
      results.reduce((sum, result) => sum + result.score, 0) / results.length,
    );
    await completeAuditRun(auditRunId, overallScore);

    await emit({
      type: "audit_completed",
      overallScore,
      progress: 100,
      quote: "Audit complete. Your bank statement has survived the London tribunal.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit failed.";
    await failAuditRun(auditRunId, message);
    await emit({
      type: "audit_failed",
      message,
      progress: 100,
      quote: "The audit tripped over a rogue contactless payment.",
    });
  }
}

async function emitProgress({
  emit,
  check,
  index,
  phase,
}: {
  emit: EmitAuditEvent;
  check: AuditCheckDefinition;
  index: number;
  phase: AuditPhase;
}) {
  await emit({
    type: "check_progress",
    checkId: check.id,
    phase,
    message: phaseMessage(phase, check.title),
    progress: progressFor(index, phaseWeights[phase]),
    quote: getAuditCopy({ checkId: check.id, phase, index }),
  });
}

function phaseMessage(phase: AuditPhase, title: string) {
  const messages: Record<AuditPhase, string> = {
    querying_data: `Collecting data for ${title}...`,
    cursor_reasoning: `Cursor is reviewing ${title}...`,
    scoring: `Scoring ${title}...`,
    saving: `Saving ${title} findings...`,
  };
  return messages[phase];
}

function progressFor(completedChecks: number, currentCheckProgress: number) {
  return Math.round(
    ((completedChecks + currentCheckProgress) / AUDIT_CHECKS.length) * 100,
  );
}

async function runCursorCheck(check: AuditCheckDefinition, data: ToolData) {
  if (!hasCursorKey()) {
    throw new Error("CURSOR_API_KEY is required to run the audit.");
  }

  const { Agent } = (await loadCursorSdk()) as {
    Agent: {
      create: (options: {
        apiKey?: string;
        model: { id: string };
        local: { cwd: string };
      }) => Promise<{
        send: (
          message: string,
          options?: { local?: { force?: boolean } },
        ) => Promise<{ wait: () => Promise<{ result?: string }> }>;
        close: () => void;
      }>;
    };
  };
  const agent = await Agent.create({
    apiKey: process.env.CURSOR_API_KEY,
    model: { id: process.env.CURSOR_MODEL ?? "composer-2" },
    local: { cwd: process.cwd() },
  });

  try {
    const run = await agent.send(buildCursorPrompt(check, data), {
      local: { force: true },
    });
    const result = await run.wait();
    return parseCursorResult(result.result ?? "", check);
  } finally {
    agent.close();
  }
}

function loadCursorSdk() {
  const packageName = "@cursor/sdk";
  const dynamicImport = new Function(
    "specifier",
    "return import(specifier)",
  ) as (specifier: string) => Promise<unknown>;

  return dynamicImport(packageName);
}

function hasCursorKey() {
  return Boolean(
    process.env.CURSOR_API_KEY &&
      process.env.CURSOR_API_KEY !== "placeholder_for_later",
  );
}

function buildCursorPrompt(check: AuditCheckDefinition, data: ToolData) {
  return `
You are running one predefined personal finance audit check.

Check:
${JSON.stringify(check, null, 2)}

Safe database tool output:
${JSON.stringify(data, null, 2)}

Return ONLY JSON matching:
{
  "checkId": "${check.id}",
  "title": "${check.title}",
  "score": number,
  "rating": "excellent" | "good" | "warning" | "critical",
  "summary": string,
  "evidence": [{"label": string, "value": string, "transactionIds"?: string[]}],
  "recommendations": string[]
}

Rules:
- Use only the provided tool output.
- Do not invent transactions.
- Score from 0 to 100.
- Be concise, practical, and London-aware.
`;
}

function parseCursorResult(
  raw: string,
  check: AuditCheckDefinition,
) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Cursor did not return JSON for ${check.title}.`);
  }

  try {
    return JSON.parse(jsonMatch[0]) as Partial<AuditCheckResult>;
  } catch {
    throw new Error(`Cursor returned invalid JSON for ${check.title}.`);
  }
}

function normalizeResult(
  check: AuditCheckDefinition,
  result: Partial<AuditCheckResult>,
): AuditCheckResult {
  const score = clampScore(result.score);
  if (
    !result.summary ||
    !Array.isArray(result.evidence) ||
    !Array.isArray(result.recommendations)
  ) {
    throw new Error(`Cursor result for ${check.title} is missing required fields.`);
  }

  return {
    checkId: check.id,
    title: check.title,
    score,
    rating: isRating(result.rating) ? result.rating : ratingForScore(score),
    summary: result.summary,
    evidence: result.evidence,
    recommendations: result.recommendations,
  };
}

function clampScore(value: unknown) {
  const score = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function isRating(value: unknown): value is AuditRating {
  return (
    value === "excellent" ||
    value === "good" ||
    value === "warning" ||
    value === "critical"
  );
}

function ratingForScore(score: number): AuditRating {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 45) return "warning";
  return "critical";
}
