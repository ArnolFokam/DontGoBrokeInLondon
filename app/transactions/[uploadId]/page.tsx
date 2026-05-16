import Link from "next/link";
import {
  getStatementTransactions,
  getStatementUpload,
} from "@/lib/statements";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

export default async function TransactionsPage({
  params,
}: {
  params: Promise<{ uploadId: string }>;
}) {
  const { uploadId } = await params;
  const [upload, transactions] = await Promise.all([
    getStatementUpload(uploadId),
    getStatementTransactions(uploadId),
  ]);

  const moneyIn = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const moneyOut = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  return (
    <main className="min-h-screen bg-[#f5fbfa] px-4 py-6 text-[#063b43] sm:px-6">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border border-[#dcebe9] bg-white p-6 shadow-[0_30px_100px_rgba(6,59,67,0.12)] sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0a6b70]">
                Transactions
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#083b43] sm:text-5xl">
                Extracted statement data
              </h1>
              <p className="mt-3 text-sm font-medium text-[#6f898d]">
                {transactions.length} transactions from {upload?.file_count ?? 0} PDF
                {upload?.file_count === 1 ? "" : "s"}.
              </p>
            </div>
            <Link
              href="/upload"
              className="rounded-full bg-[#073f4a] px-6 py-3 text-center text-sm font-black text-white transition hover:bg-[#0a5663]"
            >
              Upload more
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f5fbfa] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0a6b70]">
                Money in
              </p>
              <p className="mt-1 text-2xl font-black">{formatGbp(moneyIn)}</p>
            </div>
            <div className="rounded-2xl bg-[#f5fbfa] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0a6b70]">
                Money out
              </p>
              <p className="mt-1 text-2xl font-black">{formatGbp(moneyOut)}</p>
            </div>
            <div className="rounded-2xl bg-[#f5fbfa] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0a6b70]">
                Net
              </p>
              <p className="mt-1 text-2xl font-black">{formatGbp(moneyIn - moneyOut)}</p>
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-[2rem] border border-[#dcebe9] bg-white shadow-[0_20px_70px_rgba(6,59,67,0.08)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-[#073f4a] text-white">
                <tr>
                  <th className="px-5 py-4 font-black">Date</th>
                  <th className="px-5 py-4 font-black">Description</th>
                  <th className="px-5 py-4 text-right font-black">Amount</th>
                  <th className="px-5 py-4 text-right font-black">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2f3f1]">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="align-top">
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-[#527176]">
                      {transaction.rawDate}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-black text-[#083b43]">
                        {transaction.description}
                      </p>
                      {transaction.details.length > 0 && (
                        <p className="mt-1 max-w-xl text-xs font-medium leading-5 text-[#6f898d]">
                          {transaction.details.join(" · ")}
                        </p>
                      )}
                    </td>
                    <td
                      className={`whitespace-nowrap px-5 py-4 text-right font-black ${
                        transaction.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {formatGbp(transaction.amount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-[#527176]">
                      {formatGbp(transaction.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
