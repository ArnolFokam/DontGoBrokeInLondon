import type { AuditCheckId } from "@/lib/audit-types";

export type AuditCheckDefinition = {
  id: AuditCheckId;
  title: string;
  category: string;
  description: string;
};

export const AUDIT_CHECKS: AuditCheckDefinition[] = [
  {
    id: "cashflow_health",
    title: "Cashflow Health",
    category: "Core",
    description: "Compare money in, money out, ending balance, and net position.",
  },
  {
    id: "rent_burden",
    title: "Rent Burden",
    category: "London pressure",
    description: "Estimate rent or housing payments as a share of income.",
  },
  {
    id: "income_stability",
    title: "Income Stability",
    category: "Income",
    description: "Check whether income appears regular, salary-like, and reliable.",
  },
  {
    id: "savings_discipline",
    title: "Savings Discipline",
    category: "Savings",
    description: "Measure savings transfers and whether savings are quickly withdrawn.",
  },
  {
    id: "spending_leakage",
    title: "Spending Leakage",
    category: "Everyday spend",
    description: "Find repeated small discretionary spending and subscription drag.",
  },
];
