export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 pb-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-400">
              AdvantEdge Global Enterprises
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              AGE Trade Intelligence
            </h1>
          </div>

          <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:block">
            Global Trade Intelligence
          </div>
        </header>

        {/* Hero */}
        <section className="py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Global • Intelligence • Due Diligence
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
            Know the company.
            <br />
            Understand the trade.
            <br />
            Verify the counterparty.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Search companies, discover buyers and suppliers, investigate
            documents, and build evidence-based trade intelligence from
            lawful data sources around the world.
          </p>

          {/* Search */}
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl sm:flex-row">
              <input
                type="text"
                placeholder="Search a company, registration number, website, email, phone, person, or product..."
                className="min-h-14 flex-1 rounded-xl border border-white/10 bg-slate-900 px-5 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <button className="min-h-14 rounded-xl bg-cyan-400 px-8 font-semibold text-slate-950 transition hover:bg-cyan-300">
                Search
              </button>
            </div>

            {/* Search modes */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Companies", "Buyers", "Suppliers", "Products", "Trade"].map(
                (mode) => (
                  <button
                    key={mode}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-white"
                  >
                    {mode}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* Main actions */}
        <section className="grid gap-5 md:grid-cols-3">
          <ActionCard
            title="Search Company"
            description="Investigate a company using name, registration number, LEI, website, email, phone, or person."
          />

          <ActionCard
            title="Find Buyers"
            description="Discover potential buyers by product, market, HS code, geography, and available trade evidence."
          />

          <ActionCard
            title="Find Suppliers"
            description="Discover potential suppliers and manufacturers using products, markets, company data, and trade evidence."
          />
        </section>

        {/* Intelligence areas */}
        <section className="mt-16 grid gap-5 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            title="Trade Intelligence"
            text="Analyze lawful country-level trade data without pretending it identifies individual companies."
          />

          <InfoCard
            title="Document Investigation"
            text="Upload FCOs, registrations, licences, bank letters, and other documents for structured review."
          />

          <InfoCard
            title="Risk Indicators"
            text="Surface evidence-based indicators without treating limited information as proof of risk."
          />

          <InfoCard
            title="Discovery Sources"
            text="See where information came from, when it was collected, and how confident the system is."
          />
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-white/10 py-8 text-sm text-slate-500">
          AGE Trade Intelligence • AdvantEdge Global Enterprises
        </footer>
      </div>
    </main>
  );
}

function ActionCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <button className="group rounded-2xl border border-white/10 bg-white/5 p-7 text-left transition hover:-translate-y-1 hover:border-cyan-400/50 hover:bg-white/10">
      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
        →
      </div>

      <h3 className="text-xl font-semibold">{title}</h3>

      <p className="mt-3 leading-7 text-slate-400">{description}</p>

      <p className="mt-6 text-sm font-medium text-cyan-400 group-hover:text-cyan-300">
        Explore →
      </p>
    </button>
  );
}

function InfoCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
