import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5fbfa] px-4 py-5 text-[#063b43] sm:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#f8fffe] shadow-[0_30px_100px_rgba(6,59,67,0.12)]">
        <nav className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2 text-sm font-black tracking-[-0.02em]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#073f4a] text-white">
              £
            </span>
            Don&apos;t Go Broke
          </div>
          <div className="hidden gap-8 text-xs font-bold text-[#527176] sm:flex">
            <span>Audit</span>
            <span>Statements</span>
            <span>Advice</span>
          </div>
          <Link
            href="/audit"
            className="rounded-full bg-[#073f4a] px-6 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(7,63,74,0.24)] transition hover:-translate-y-0.5 hover:bg-[#0a5663]"
          >
            Get Started
          </Link>
        </nav>

        <section className="grid gap-10 px-5 pb-12 pt-8 sm:px-8 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:pb-20 lg:pt-14">
          <div className="space-y-7">
            <p className="w-fit rounded-full bg-[#e2f3f1] px-4 py-2 text-xs font-black text-[#0a6b70]">
              AI financial audit for London life
            </p>
            <div className="space-y-5">
              <h1 className="max-w-2xl text-5xl font-black leading-[0.92] tracking-[-0.055em] text-[#083b43] sm:text-7xl lg:text-8xl">
                Don&apos;t Go Broke in London
              </h1>
              <p className="max-w-xl text-base font-medium leading-7 text-[#527176] sm:text-lg">
                What if an agent could audit your finances and give you
                financially savvy tips to thrive in one of the most expensive
                cities in the world?
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/audit"
                className="rounded-full bg-[#073f4a] px-9 py-5 text-base font-black text-white shadow-[0_22px_56px_rgba(7,63,74,0.3)] transition hover:-translate-y-0.5 hover:bg-[#0a5663]"
              >
                Get Started →
              </Link>
              <span className="text-sm font-bold text-[#6f898d]">
                Upload PDFs. Get city-smart money advice.
              </span>
            </div>
          </div>

          <div className="relative min-h-[430px]">
            <div className="absolute right-0 top-0 w-72 rounded-[2rem] bg-white p-5 shadow-[0_25px_70px_rgba(6,59,67,0.14)] sm:w-80">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-[#dff4f1] px-3 py-1 text-xs font-black text-[#0a6b70]">
                  London audit
                </span>
                <span className="text-xs font-black text-[#90a8ab]">PDF</span>
              </div>
              <p className="text-4xl font-black tracking-[-0.05em] text-[#083b43]">
                £2,850
              </p>
              <p className="mt-1 text-xs font-bold text-[#6f898d]">
                Monthly city burn estimate
              </p>
              <div className="mt-6 h-32 rounded-2xl bg-gradient-to-br from-[#0d7f83] to-[#073f4a] p-4 text-white">
                <p className="text-xs font-bold opacity-70">Insight card</p>
                <p className="mt-12 text-sm font-black">Rent, food, transport</p>
              </div>
            </div>

            <div className="absolute bottom-9 left-0 w-64 rounded-[1.75rem] bg-[#073f4a] p-5 text-white shadow-[0_25px_70px_rgba(6,59,67,0.22)]">
              <p className="text-sm font-bold text-white/65">Ready to audit</p>
              <p className="mt-3 text-5xl font-black tracking-[-0.06em]">3+</p>
              <p className="mt-1 text-sm font-bold text-white/65">statements uploaded</p>
              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div className="h-2 w-2/3 rounded-full bg-[#4bd2c2]" />
              </div>
            </div>

            <div className="absolute bottom-40 right-8 rounded-2xl bg-[#e9f7f5] px-5 py-4 text-sm font-black text-[#0a6b70] shadow-sm">
              No screenshots. PDFs only.
            </div>
          </div>
        </section>

        <section className="grid gap-4 bg-white px-5 py-8 sm:grid-cols-3 sm:px-8">
          {["Upload statements", "Add personal context", "Receive practical tips"].map((item) => (
            <div key={item} className="rounded-[1.5rem] border border-[#dcebe9] bg-[#fbfffe] p-5">
              <p className="text-sm font-black text-[#083b43]">{item}</p>
              <p className="mt-2 text-sm leading-6 text-[#6f898d]">
                Built for London costs, messy spending, and real financial goals.
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
