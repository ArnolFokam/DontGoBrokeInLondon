import pdfParse from "pdf-parse";

export type FinancialTransaction = {
  date: string;
  rawDate: string;
  description: string;
  amount: number;
  currency: "GBP";
  balance: number;
  details: string[];
};

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

const MONEY_PATTERN = /£\d{1,3}(?:,\d{3})*\.\d{2}/g;
const TRANSACTION_START_PATTERN = /^(\d{1,2} [A-Z][a-z]{2} \d{4})\s*(.+)$/;
const DETAIL_LINE_PATTERN = /^(To|From|Reference|Card|Fee):\s+.+$|^Revolut Rate\b.+$/;

export async function extractTextFromPdf(file: ArrayBuffer | Uint8Array) {
  const data = Buffer.from(file instanceof Uint8Array ? file : new Uint8Array(file));
  const result = await pdfParse(data);
  return result.text;
}

export async function parseRevolutStatementPdf(file: ArrayBuffer | Uint8Array) {
  const text = await extractTextFromPdf(file);
  return parseRevolutStatementText(text);
}

export function parseRevolutStatementText(text: string): FinancialTransaction[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const accountLines = getAccountTransactionLines(lines);
  const openingBalance = getOpeningBalance(lines);
  const transactions: FinancialTransaction[] = [];
  let previousBalance = openingBalance;

  for (const line of accountLines) {
    if (isTableHeader(line)) continue;

    const row = parseTransactionRow(line, previousBalance);
    if (row) {
      transactions.push(row);
      previousBalance = row.balance;
      continue;
    }

    const lastTransaction = transactions.at(-1);
    if (lastTransaction && DETAIL_LINE_PATTERN.test(line)) {
      lastTransaction.details.push(line);
    }
  }

  return transactions;
}

function getAccountTransactionLines(lines: string[]) {
  const sectionIndex = lines.findIndex((line) =>
    line.startsWith("Account transactions from "),
  );

  if (sectionIndex === -1) return [];

  const startIndex = lines.findIndex(
    (line, index) => index > sectionIndex && isAccountTableHeader(line),
  );

  if (startIndex === -1) return [];

  const endIndex = lines.findIndex(
    (line, index) => index > startIndex && line.startsWith("Reverted from "),
  );

  return lines.slice(startIndex + 1, endIndex === -1 ? undefined : endIndex);
}

function parseTransactionRow(
  line: string,
  previousBalance: number | undefined,
): FinancialTransaction | null {
  const rowMatch = line.match(TRANSACTION_START_PATTERN);
  if (!rowMatch) return null;

  const [, rawDate, rest] = rowMatch;
  const moneyMatches = Array.from(rest.matchAll(MONEY_PATTERN));
  if (moneyMatches.length < 2) return null;

  const amountMatch = moneyMatches.at(-2);
  const balanceMatch = moneyMatches.at(-1);
  const rawAmount = amountMatch?.[0];
  const rawBalance = balanceMatch?.[0];
  if (!rawAmount || !rawBalance) return null;

  const description = rest.slice(0, amountMatch.index).trim();
  const absoluteAmount = parseMoney(rawAmount);
  const balance = parseMoney(rawBalance);
  const amount = signedAmount(absoluteAmount, balance, previousBalance);

  return {
    date: toIsoDate(rawDate),
    rawDate,
    description,
    amount,
    currency: "GBP",
    balance,
    details: [],
  };
}

function signedAmount(
  amount: number,
  balance: number,
  previousBalance: number | undefined,
) {
  if (previousBalance === undefined) return amount;

  const delta = roundMoney(balance - previousBalance);
  if (delta < 0) return -amount;
  if (delta > 0) return amount;
  return amount;
}

function getOpeningBalance(lines: string[]) {
  const summaryLine = lines.find((line) => line.startsWith("Account (Current Account)"));
  const values = summaryLine?.match(MONEY_PATTERN);
  return values?.[0] ? parseMoney(values[0]) : undefined;
}

function parseMoney(value: string) {
  return Number(value.replace(/[£,]/g, ""));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function toIsoDate(rawDate: string) {
  const [day, month, year] = rawDate.split(" ");
  return `${year}-${MONTHS[month]}-${day.padStart(2, "0")}`;
}

function isTableHeader(line: string) {
  return isAccountTableHeader(line) || isPendingTableHeader(line);
}

function isAccountTableHeader(line: string) {
  return (
    line === "Date Description Money out Money in Balance" ||
    line === "DateDescriptionMoney outMoney inBalance"
  );
}

function isPendingTableHeader(line: string) {
  return (
    line === "Start date Description Money out Money in" ||
    line === "Start dateDescriptionMoney outMoney in"
  );
}
