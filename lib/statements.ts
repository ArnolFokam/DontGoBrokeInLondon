import { all, get, run } from "@/lib/db";
import type { FinancialTransaction } from "@/lib/parsing";

type ParsedStatementFile = {
  fileName: string;
  transactionCount: number;
  transactions: FinancialTransaction[];
};

export type StoredTransaction = {
  id: string;
  uploadId: string;
  fileId: string;
  date: string;
  rawDate: string;
  description: string;
  amount: number;
  currency: string;
  balance: number;
  details: string[];
};

type TransactionRow = {
  id: string;
  upload_id: string;
  file_id: string;
  transaction_date: string;
  raw_date: string;
  description: string;
  amount: number;
  currency: string;
  balance: number;
  details: string;
};

type StatementUploadRow = {
  id: string;
  voice_transcript: string | null;
  file_count: number;
  transaction_count: number;
  created_at: string;
};

export async function saveStatementUpload({
  uploadId,
  voiceTranscript,
  files,
}: {
  uploadId: string;
  voiceTranscript: string;
  files: ParsedStatementFile[];
}) {
  await ensureStatementSchema();

  await run(
    `INSERT INTO statement_uploads (id, voice_transcript, file_count, transaction_count, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      uploadId,
      voiceTranscript,
      files.length,
      files.reduce((total, file) => total + file.transactionCount, 0),
      new Date().toISOString(),
    ],
  );

  for (const file of files) {
    const fileId = crypto.randomUUID();

    await run(
      `INSERT INTO statement_files (id, upload_id, file_name, transaction_count)
       VALUES (?, ?, ?, ?)`,
      [fileId, uploadId, file.fileName, file.transactionCount],
    );

    for (const transaction of file.transactions) {
      await run(
        `INSERT INTO statement_transactions
          (id, upload_id, file_id, transaction_date, raw_date, description, amount, currency, balance, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          uploadId,
          fileId,
          transaction.date,
          transaction.rawDate,
          transaction.description,
          transaction.amount,
          transaction.currency,
          transaction.balance,
          JSON.stringify(transaction.details),
        ],
      );
    }
  }
}

export async function getStatementUpload(uploadId: string) {
  await ensureStatementSchema();

  return (await get(
    `SELECT id, voice_transcript, file_count, transaction_count, created_at
     FROM statement_uploads
     WHERE id = ?`,
    [uploadId],
  )) as unknown as StatementUploadRow | undefined;
}

export async function getStatementTransactions(uploadId: string) {
  await ensureStatementSchema();

  const rows = (await all(
    `SELECT id, upload_id, file_id, transaction_date, raw_date, description, amount, currency, balance, details
     FROM statement_transactions
     WHERE upload_id = ?
     ORDER BY transaction_date ASC, rowid ASC`,
    [uploadId],
  )) as unknown as TransactionRow[];

  return rows.map((row) => ({
    id: row.id,
    uploadId: row.upload_id,
    fileId: row.file_id,
    date: row.transaction_date,
    rawDate: row.raw_date,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency,
    balance: Number(row.balance),
    details: JSON.parse(row.details || "[]") as string[],
  }));
}

async function ensureStatementSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS statement_uploads (
      id TEXT PRIMARY KEY,
      voice_transcript TEXT,
      file_count INTEGER NOT NULL,
      transaction_count INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS statement_files (
      id TEXT PRIMARY KEY,
      upload_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      transaction_count INTEGER NOT NULL,
      FOREIGN KEY (upload_id) REFERENCES statement_uploads(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS statement_transactions (
      id TEXT PRIMARY KEY,
      upload_id TEXT NOT NULL,
      file_id TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      raw_date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      balance REAL NOT NULL,
      details TEXT NOT NULL,
      FOREIGN KEY (upload_id) REFERENCES statement_uploads(id),
      FOREIGN KEY (file_id) REFERENCES statement_files(id)
    )
  `);
}
