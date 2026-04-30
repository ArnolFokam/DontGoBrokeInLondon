import type { AuditRating } from "@/lib/audit-types";

export function clampScore(value: unknown) {
  const score = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function ratingForScore(score: number): AuditRating {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 45) return "warning";
  return "critical";
}

export function gradeForScore(score: number) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 45) return "C";
  return "F";
}

export function gradeClass(score: number) {
  const grade = gradeForScore(score);

  if (grade === "A+") return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (grade === "A") return "bg-teal-100 text-teal-700 ring-teal-200";
  if (grade === "B") return "bg-blue-100 text-blue-700 ring-blue-200";
  if (grade === "C") return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-rose-100 text-rose-700 ring-rose-200";
}
