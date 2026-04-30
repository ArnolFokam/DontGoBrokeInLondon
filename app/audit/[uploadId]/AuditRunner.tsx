"use client";

import { useEffect, useState } from "react";
import type { AuditCheckResult, AuditStreamEvent } from "@/lib/audit-types";

type SavedReport = {
  status: string;
  overallScore: number | null;
  checks: AuditCheckResult[];
} | null;

function gradeForScore(score: number) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 45) return "C";
  return "F";
}

function gradeClass(score: number) {
  const grade = gradeForScore(score);

  if (grade === "A+") return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (grade === "A") return "bg-teal-100 text-teal-700 ring-teal-200";
  if (grade === "B") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (grade === "C") return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-rose-100 text-rose-700 ring-rose-200";
}

export default function AuditRunner({ uploadId }: { uploadId: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [quote, setQuote] = useState("Ready when you are. London is already warming up.");
  const [currentStep, setCurrentStep] = useState("Waiting to start");
  const [results, setResults] = useState<AuditCheckResult[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      const response = await fetch(`/api/audit/${uploadId}`);
      const data = (await response.json()) as { report: SavedReport };
      if (!data.report) return;

      setResults(data.report.checks);
      setOverallScore(data.report.overallScore);
      setProgress(data.report.status === "completed" ? 100 : 0);
      setCurrentStep(
        data.report.status === "completed"
          ? "Audit completed"
          : `${data.report.checks.length} checks saved`,
      );
    }

    void loadReport();
  }, [uploadId]);

  async function runAudit() {
    setIsRunning(true);
    setError(null);
    setResults([]);
    setOverallScore(null);
    setProgress(0);

    const response = await fetch(`/api/audit/${uploadId}/run`, {
      method: "POST",
    });

    if (!response.body) {
      setIsRunning(false);
      setError("Could not start audit stream.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const line = chunk.split("\n").find((entry) => entry.startsWith("data: "));
        if (!line) continue;
        handleEvent(JSON.parse(line.slice(6)) as AuditStreamEvent);
      }
    }

    setIsRunning(false);
  }

  function handleEvent(event: AuditStreamEvent) {
    setProgress(event.progress);

    if ("quote" in event) {
      setQuote(event.quote);
    }

    if (event.type === "audit_started") {
      setCurrentStep("Starting audit");
    }

    if (event.type === "check_started") {
      setCurrentStep(`${event.checkIndex} / ${event.totalChecks}: ${event.title}`);
    }

    if (event.type === "check_progress") {
      setCurrentStep(event.message);
    }

    if (event.type === "check_completed") {
      setResults((current) => [...current, event.result]);
      setCurrentStep(`${event.checkIndex} / ${event.totalChecks}: ${event.result.title} complete`);
    }

    if (event.type === "audit_completed") {
      setOverallScore(event.overallScore);
      setCurrentStep("Audit completed");
    }

    if (event.type === "audit_failed") {
      setError(event.message);
      setCurrentStep("Audit failed");
      setIsRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5fbfa] px-4 py-8 text-[#063b43] sm:px-6">
      <section className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-[2rem] border border-[#dcebe9] bg-white p-6 text-center shadow-[0_30px_100px_rgba(6,59,67,0.12)] sm:p-10">
          <div className="mx-auto max-w-2xl">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0a6b70]">
                Audit workspace
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#083b43] sm:text-5xl">
                London survival audit
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-[#6f898d]">
                We run five checks and turn the result into a simple grade.
              </p>
            </div>
            <button
              type="button"
              onClick={runAudit}
              disabled={isRunning}
              className="mt-7 rounded-full bg-[#073f4a] px-8 py-4 text-sm font-black text-white transition hover:bg-[#0a5663] disabled:bg-[#d8e8e6] disabled:text-[#90a8ab]"
            >
              {isRunning ? "Running..." : results.length ? "Run again" : "Run audit"}
            </button>
          </div>

          <div className="mx-auto mt-10 max-w-2xl">
            <div className="mb-3 flex items-center justify-between gap-4 text-sm font-black text-[#527176]">
              <span>{currentStep}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#e2f3f1]">
              <div
                className="h-full rounded-full bg-[#073f4a] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-5 rounded-[1.25rem] bg-[#f5fbfa] p-5 text-center text-sm font-black leading-6 text-[#0a6b70]">
              {quote}
            </p>
          </div>

          {overallScore !== null && (
            <div className="mx-auto mt-8 max-w-xs rounded-[1.5rem] bg-[#073f4a] p-6 text-white">
              <p className="text-sm font-bold text-white/70">Overall grade</p>
              <p className="mt-2 text-6xl font-black tracking-[-0.06em]">
                {gradeForScore(overallScore)}
              </p>
              <p className="mt-1 text-sm font-bold text-white/70">{overallScore}%</p>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-[#fecaca] bg-[#fff1f2] p-4 text-sm font-black text-[#be123c]">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {results.map((result) => (
            <section key={result.checkId} className="rounded-[2rem] border border-[#dcebe9] bg-white p-6 sm:p-8">
              <div className="grid gap-6 sm:grid-cols-[120px_1fr] sm:items-start">
                <div
                  className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-4xl font-black ring-8 ${gradeClass(result.score)} sm:mx-0`}
                >
                  {gradeForScore(result.score)}
                </div>

                <div className="text-center sm:text-left">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-black tracking-[-0.035em] text-[#083b43]">
                    {result.title}
                    </h2>
                    <span className="text-sm font-black text-[#6f898d]">
                      {result.score}%
                    </span>
                  </div>

                  <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-7 text-[#527176] sm:mx-0">
                    {result.summary}
                  </p>

                  {result.evidence.length > 0 && (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {result.evidence.map((item) => (
                        <div
                          key={`${item.label}-${item.value}`}
                          className="rounded-2xl bg-[#fbfffe] px-4 py-3 text-sm"
                        >
                          <p className="font-bold text-[#6f898d]">{item.label}</p>
                          <p className="mt-1 font-black text-[#083b43]">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.recommendations.length > 0 && (
                    <div className="mt-6 rounded-[1.25rem] bg-[#f5fbfa] p-5">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0a6b70]">
                        Recommendations
                      </p>
                      <ul className="mt-3 space-y-2 text-sm font-medium leading-6 text-[#527176]">
                        {result.recommendations.map((recommendation) => (
                          <li key={recommendation}>• {recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
