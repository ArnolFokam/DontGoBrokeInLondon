import { all, get, run } from "@/lib/db";
import type { AuditCheckResult } from "@/lib/audit-types";

type AuditRunRow = {
  id: string;
  upload_id: string;
  status: string;
  overall_score: number | null;
  started_at: string;
  completed_at: string | null;
  error: string | null;
};

type AuditCheckResultRow = {
  id: string;
  audit_run_id: string;
  upload_id: string;
  check_id: string;
  title: string;
  score: number;
  rating: AuditCheckResult["rating"];
  summary: string;
  evidence: string;
  recommendations: string;
  created_at: string;
};

export async function ensureAuditRunSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS audit_runs (
      id TEXT PRIMARY KEY,
      upload_id TEXT NOT NULL,
      status TEXT NOT NULL,
      overall_score REAL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      error TEXT,
      FOREIGN KEY (upload_id) REFERENCES audit_uploads(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS audit_check_results (
      id TEXT PRIMARY KEY,
      audit_run_id TEXT NOT NULL,
      upload_id TEXT NOT NULL,
      check_id TEXT NOT NULL,
      title TEXT NOT NULL,
      score REAL NOT NULL,
      rating TEXT NOT NULL,
      summary TEXT NOT NULL,
      evidence TEXT NOT NULL,
      recommendations TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (audit_run_id) REFERENCES audit_runs(id),
      FOREIGN KEY (upload_id) REFERENCES audit_uploads(id)
    )
  `);
}

export async function createAuditRun(uploadId: string) {
  await ensureAuditRunSchema();
  const auditRunId = crypto.randomUUID();

  await run(
    `INSERT INTO audit_runs (id, upload_id, status, started_at)
     VALUES (?, ?, ?, ?)`,
    [auditRunId, uploadId, "running", new Date().toISOString()],
  );

  return auditRunId;
}

export async function saveAuditCheckResult({
  auditRunId,
  uploadId,
  result,
}: {
  auditRunId: string;
  uploadId: string;
  result: AuditCheckResult;
}) {
  await run(
    `INSERT INTO audit_check_results
       (id, audit_run_id, upload_id, check_id, title, score, rating, summary, evidence, recommendations, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      auditRunId,
      uploadId,
      result.checkId,
      result.title,
      result.score,
      result.rating,
      result.summary,
      JSON.stringify(result.evidence),
      JSON.stringify(result.recommendations),
      new Date().toISOString(),
    ],
  );
}

export async function completeAuditRun(auditRunId: string, overallScore: number) {
  await run(
    `UPDATE audit_runs
     SET status = ?, overall_score = ?, completed_at = ?
     WHERE id = ?`,
    ["completed", overallScore, new Date().toISOString(), auditRunId],
  );
}

export async function failAuditRun(auditRunId: string, error: string) {
  await run(
    `UPDATE audit_runs
     SET status = ?, error = ?, completed_at = ?
     WHERE id = ?`,
    ["failed", error, new Date().toISOString(), auditRunId],
  );
}

export async function getLatestAuditReport(uploadId: string) {
  await ensureAuditRunSchema();

  const runRow = (await get(
    `SELECT id, upload_id, status, overall_score, started_at, completed_at, error
     FROM audit_runs
     WHERE upload_id = ?
     ORDER BY started_at DESC
     LIMIT 1`,
    [uploadId],
  )) as unknown as AuditRunRow | undefined;

  if (!runRow) return null;

  const rows = (await all(
    `SELECT id, audit_run_id, upload_id, check_id, title, score, rating, summary, evidence, recommendations, created_at
     FROM audit_check_results
     WHERE audit_run_id = ?
     ORDER BY created_at ASC`,
    [runRow.id],
  )) as unknown as AuditCheckResultRow[];

  return {
    auditRunId: runRow.id,
    uploadId: runRow.upload_id,
    status: runRow.status,
    overallScore: runRow.overall_score,
    startedAt: runRow.started_at,
    completedAt: runRow.completed_at,
    error: runRow.error,
    checks: rows.map((row) => ({
      checkId: row.check_id,
      title: row.title,
      score: row.score,
      rating: row.rating,
      summary: row.summary,
      evidence: JSON.parse(row.evidence) as AuditCheckResult["evidence"],
      recommendations: JSON.parse(row.recommendations) as string[],
    })),
  };
}
