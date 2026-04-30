import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type UploadError = {
  field: string;
  reason: string;
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

  return NextResponse.json({
    success: true,
    message: "Documents uploaded and validated successfully",
    uploadId: crypto.randomUUID(),
    fileCount: files.length,
    voiceTranscriptReceived:
      typeof voiceTranscript === "string" && voiceTranscript.trim().length > 0,
    timestamp: new Date().toISOString(),
  });
}
