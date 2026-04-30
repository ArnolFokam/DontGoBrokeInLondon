import AuditRunner from "@/app/audit/[uploadId]/AuditRunner";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ uploadId: string }>;
}) {
  const { uploadId } = await params;

  return <AuditRunner uploadId={uploadId} />;
}
