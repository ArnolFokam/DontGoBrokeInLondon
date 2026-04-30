export default async function AuditPage({
  params,
}: {
  params: Promise<{ uploadId: string }>;
}) {
  const { uploadId } = await params;

  return (
    <main className="min-h-screen bg-[#f5fbfa] px-4 py-6 text-[#063b43] sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col justify-center">
        <div className="rounded-[1.75rem] border border-[#dcebe9] bg-white p-8 text-center shadow-[0_30px_100px_rgba(6,59,67,0.12)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0a6b70]">
            Audit workspace
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-[#083b43] sm:text-5xl">
            Your audit is ready to start
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-6 text-[#6f898d]">
            We saved your statement transactions. The checks will appear here in
            the next checkpoint.
          </p>
          <p className="mt-6 rounded-full bg-[#eef7f6] px-4 py-3 text-xs font-black text-[#527176]">
            Upload ID: {uploadId}
          </p>
        </div>
      </section>
    </main>
  );
}
