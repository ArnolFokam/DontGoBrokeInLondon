import { all, get } from "@/lib/db";

type TransactionRow = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  balance: number;
  details: string;
};

type MerchantRow = {
  merchant: string;
  count: number;
  total_spend: number;
};

type SummaryRow = {
  money_in: number;
  money_out: number;
  net_cashflow: number;
  transaction_count: number;
  ending_balance: number | null;
};

function toNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function normalizeTransaction(row: TransactionRow) {
  return {
    id: row.id,
    date: row.transaction_date,
    description: row.description,
    amount: toNumber(row.amount),
    balance: toNumber(row.balance),
    details: JSON.parse(row.details || "[]") as string[],
  };
}

export async function getTransactions(uploadId: string) {
  const rows = (await all(
    `SELECT id, transaction_date, description, amount, balance, details
     FROM financial_transactions
     WHERE upload_id = ?
     ORDER BY transaction_date ASC, rowid ASC`,
    [uploadId],
  )) as unknown as TransactionRow[];

  return rows.map(normalizeTransaction);
}

export async function getCashflowSummary(uploadId: string) {
  const row = (await get(
    `SELECT
       COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS money_in,
       COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) AS money_out,
       COALESCE(SUM(amount), 0) AS net_cashflow,
       COUNT(*) AS transaction_count,
       (SELECT balance FROM financial_transactions WHERE upload_id = ? ORDER BY transaction_date DESC, rowid DESC LIMIT 1) AS ending_balance
     FROM financial_transactions
     WHERE upload_id = ?`,
    [uploadId, uploadId],
  )) as unknown as SummaryRow | undefined;

  return {
    moneyIn: toNumber(row?.money_in),
    moneyOut: toNumber(row?.money_out),
    netCashflow: toNumber(row?.net_cashflow),
    transactionCount: toNumber(row?.transaction_count),
    endingBalance: row?.ending_balance === null ? null : toNumber(row?.ending_balance),
  };
}

export async function getIncomeTransactions(uploadId: string) {
  const rows = (await all(
    `SELECT id, transaction_date, description, amount, balance, details
     FROM financial_transactions
     WHERE upload_id = ?
       AND amount > 0
       AND (
         LOWER(description) LIKE '%salary%'
         OR LOWER(description) LIKE 'payment from%'
         OR LOWER(description) LIKE '%payroll%'
         OR LOWER(details) LIKE '%salary%'
       )
     ORDER BY amount DESC`,
    [uploadId],
  )) as unknown as TransactionRow[];

  return rows.map(normalizeTransaction);
}

export async function getRentCandidates(uploadId: string) {
  const rows = (await all(
    `SELECT id, transaction_date, description, amount, balance, details
     FROM financial_transactions
     WHERE upload_id = ?
       AND amount < 0
       AND (
         LOWER(description) LIKE '%rent%'
         OR LOWER(description) LIKE '%residential%'
         OR LOWER(details) LIKE '%rent%'
         OR LOWER(details) LIKE '%residential%'
       )
     ORDER BY ABS(amount) DESC`,
    [uploadId],
  )) as unknown as TransactionRow[];

  return rows.map(normalizeTransaction);
}

export async function getSavingsTransfers(uploadId: string) {
  const rows = (await all(
    `SELECT id, transaction_date, description, amount, balance, details
     FROM financial_transactions
     WHERE upload_id = ?
       AND (
         LOWER(description) LIKE '%savings%'
         OR LOWER(description) LIKE '%investment%'
         OR LOWER(description) LIKE '%isa%'
       )
     ORDER BY transaction_date ASC, rowid ASC`,
    [uploadId],
  )) as unknown as TransactionRow[];

  return rows.map(normalizeTransaction);
}

export async function getRecurringMerchants(uploadId: string) {
  const rows = (await all(
    `SELECT description AS merchant, COUNT(*) AS count, SUM(ABS(amount)) AS total_spend
     FROM financial_transactions
     WHERE upload_id = ? AND amount < 0
     GROUP BY description
     HAVING COUNT(*) >= 2
     ORDER BY total_spend DESC`,
    [uploadId],
  )) as unknown as MerchantRow[];

  return rows.map((row) => ({
    merchant: row.merchant,
    count: toNumber(row.count),
    totalSpend: toNumber(row.total_spend),
  }));
}

export async function getLargestExpenses(uploadId: string, limit = 10) {
  const rows = (await all(
    `SELECT id, transaction_date, description, amount, balance, details
     FROM financial_transactions
     WHERE upload_id = ? AND amount < 0
     ORDER BY ABS(amount) DESC
     LIMIT ?`,
    [uploadId, limit],
  )) as unknown as TransactionRow[];

  return rows.map(normalizeTransaction);
}

export async function getAuditToolData(uploadId: string) {
  const [
    cashflow,
    incomeTransactions,
    rentCandidates,
    savingsTransfers,
    recurringMerchants,
    largestExpenses,
  ] = await Promise.all([
    getCashflowSummary(uploadId),
    getIncomeTransactions(uploadId),
    getRentCandidates(uploadId),
    getSavingsTransfers(uploadId),
    getRecurringMerchants(uploadId),
    getLargestExpenses(uploadId),
  ]);

  return {
    cashflow,
    incomeTransactions,
    rentCandidates,
    savingsTransfers,
    recurringMerchants,
    largestExpenses,
  };
}
