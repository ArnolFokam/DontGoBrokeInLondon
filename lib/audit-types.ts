export type AuditCheckId =
  | "cashflow_health"
  | "rent_burden"
  | "income_stability"
  | "savings_discipline"
  | "spending_leakage";

export type AuditPhase =
  | "querying_data"
  | "cursor_reasoning"
  | "scoring"
  | "saving";

export type AuditRating = "excellent" | "good" | "warning" | "critical";

export type AuditEvidence = {
  label: string;
  value: string;
  transactionIds?: string[];
};

export type AuditCheckResult = {
  checkId: AuditCheckId;
  title: string;
  score: number;
  rating: AuditRating;
  summary: string;
  evidence: AuditEvidence[];
  recommendations: string[];
};

export type AuditStreamEvent =
  | {
      type: "audit_started";
      auditRunId: string;
      totalChecks: number;
      progress: number;
      quote: string;
    }
  | {
      type: "check_started";
      checkId: AuditCheckId;
      title: string;
      checkIndex: number;
      totalChecks: number;
      progress: number;
      quote: string;
    }
  | {
      type: "check_progress";
      checkId: AuditCheckId;
      phase: AuditPhase;
      message: string;
      progress: number;
      quote: string;
    }
  | {
      type: "check_completed";
      result: AuditCheckResult;
      checkIndex: number;
      totalChecks: number;
      progress: number;
      quote: string;
    }
  | {
      type: "audit_completed";
      overallScore: number;
      progress: 100;
      quote: string;
    }
  | {
      type: "audit_failed";
      message: string;
      progress: number;
      quote: string;
    };
