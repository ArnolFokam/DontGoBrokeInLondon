import { NextResponse } from "next/server";
import {
  type FinancialTransaction,
  parseRevolutStatementPdf,
} from "@/lib/parsing";
import { saveAuditUpload } from "@/lib/audits";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type UploadError = {
  field: string;
  reason: string;
};

type ParsedFile = {
  fileName: string;
  transactionCount: number;
  transactions: FinancialTransaction[];
};

function isPdf(file: File) {
  return (
    file.name.toLowerCase().endsWith(".pdf") &&
    (!file.type || file.type === "application/pdf")
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const voiceTranscript = formData.get("voiceTranscript");
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  const errors: UploadError[] = [];

  if (files.length === 0) {
    errors.push({ field: "files", reason: "At least one PDF file is required." });
  }

  for (const file of files) {
    if (!isPdf(file)) {
      errors.push({ field: "fileType", reason: `${file.name} must be a PDF.` });
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push({ field: "files", reason: `${file.name} must be under 10MB.` });
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { success: false, message: errors[0].reason, errors },
      { status: 400 },
    );
  }

  const parsedFiles: ParsedFile[] = [];
  let totalTransactions = 0;
  const uploadId = crypto.randomUUID();
  const voiceTranscriptValue =
    typeof voiceTranscript === "string" ? voiceTranscript.trim() : "";

  try {
    for (const file of files) {
      const transactions = await parseRevolutStatementPdf(await file.arrayBuffer());
      parsedFiles.push({
        fileName: file.name,
        transactionCount: transactions.length,
        transactions,
      });
      totalTransactions += transactions.length;
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Could not parse the Revolut statement PDF.",
        errors: [
          {
            field: "files",
            reason: "Please upload a readable Revolut PDF statement.",
          },
        ],
      },
      { status: 400 },
    );
  }

  try {
    await saveAuditUpload({
      uploadId,
      voiceTranscript: voiceTranscriptValue,
      files: parsedFiles,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Could not save the audit data.",
        errors: [
          {
            field: "database",
            reason: "Parsed transactions could not be saved. Please try again.",
          },
        ],
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Documents uploaded, validated, and parsed successfully",
    uploadId,
    fileCount: files.length,
    totalTransactions,
    parsedFiles,
    voiceTranscriptReceived: voiceTranscriptValue.length > 0,
    timestamp: new Date().toISOString(),
  });
}
