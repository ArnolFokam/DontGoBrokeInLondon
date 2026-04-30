import { getLatestAuditReport } from "@/lib/audit-report";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  const { uploadId } = await params;
  const report = await getLatestAuditReport(uploadId);

  return NextResponse.json({ report });
}
