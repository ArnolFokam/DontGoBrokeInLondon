import type { AuditCheckId, AuditPhase } from "@/lib/audit-types";

const globalCopy = [
  "Auditing your money before London audits it for you.",
  "Putting your bank statement through the financial Oyster reader.",
  "London costs are loading. Emotional damage pending.",
  "Checking if your bank balance has started avoiding eye contact.",
];

const checkCopy: Record<AuditCheckId, string[]> = {
  cashflow_health: [
    "Checking if payday survived contact with London.",
    "Seeing whether money in and money out are still on speaking terms.",
    "Finding out if your cashflow is thriving or just doing vibes.",
  ],
  rent_burden: [
    "Measuring how much of your salary your landlord has adopted.",
    "Checking if rent is behaving like rent or like a hostile takeover.",
    "Seeing whether housing costs have entered Monopoly board territory.",
  ],
  income_stability: [
    "Looking for salary patterns like a detective in Zone 2.",
    "Checking whether income arrives like clockwork or like the Northern line.",
    "Seeing if top-ups are support acts or the main show.",
  ],
  savings_discipline: [
    "Checking if your savings are staying saved or doing a return journey.",
    "Seeing if your emergency fund has main character energy.",
    "Looking for savings that did not immediately get recalled to active duty.",
  ],
  spending_leakage: [
    "Checking if Pret has become a fixed monthly liability.",
    "Finding subscriptions hiding like foxes behind bins.",
    "Seeing whether a quick Tesco run became an economic event.",
    "Checking if little purchases are moving like a swarm of Lime bikes.",
  ],
};

const phaseCopy: Record<AuditPhase, string[]> = {
  querying_data: [
    "Opening the books, gently, like a council tax letter.",
    "Fetching transactions from the vault.",
    "Sorting the pounds from the panic.",
  ],
  cursor_reasoning: [
    "Putting on the tiny financial detective hat.",
    "Connecting dots, receipts, and questionable lunch decisions.",
    "Letting the agent stare dramatically at your spending patterns.",
  ],
  scoring: [
    "Turning financial chaos into a percentage.",
    "Assigning scores with the emotional restraint of an accountant.",
    "Converting London survival into numbers.",
  ],
  saving: [
    "Writing the verdict down before someone buys another meal deal.",
    "Saving the findings with all the seriousness of a mortgage application.",
    "Putting the report where future-you can find it.",
  ],
};

export function getAuditCopy({
  checkId,
  phase,
  index = 0,
}: {
  checkId?: AuditCheckId;
  phase?: AuditPhase;
  index?: number;
}) {
  const pool = [
    ...(checkId ? checkCopy[checkId] : []),
    ...(phase ? phaseCopy[phase] : []),
    ...globalCopy,
  ];

  return pool[index % pool.length];
}
