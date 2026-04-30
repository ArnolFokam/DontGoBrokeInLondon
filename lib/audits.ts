import { run } from "@/lib/db";
import type { FinancialTransaction } from "@/lib/parsing";

type ParsedStatementFile = {
  fileName: string;
  transactionCount: number;
  transactions: FinancialTransaction[];
};

export async function saveAuditUpload({
  uploadId,
  voiceTranscript,
  files,
}: {
  uploadId: string;
  voiceTranscript: string;
  files: ParsedStatementFile[];
}) {
  await ensureAuditSchema();

  await run(
    `INSERT INTO audit_uploads (id, voice_transcript, file_count, transaction_count, created_at)
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
      `INSERT INTO audit_files (id, upload_id, file_name, transaction_count)
       VALUES (?, ?, ?, ?)`,
      [fileId, uploadId, file.fileName, file.transactionCount],
    );

    for (const transaction of file.transactions) {
      await run(
        `INSERT INTO financial_transactions
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

async function ensureAuditSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS audit_uploads (
      id TEXT PRIMARY KEY,
      voice_transcript TEXT,
      file_count INTEGER NOT NULL,
      transaction_count INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS audit_files (
      id TEXT PRIMARY KEY,
      upload_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      transaction_count INTEGER NOT NULL,
      FOREIGN KEY (upload_id) REFERENCES audit_uploads(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS financial_transactions (
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
      FOREIGN KEY (upload_id) REFERENCES audit_uploads(id),
      FOREIGN KEY (file_id) REFERENCES audit_files(id)
    )
  `);
}
