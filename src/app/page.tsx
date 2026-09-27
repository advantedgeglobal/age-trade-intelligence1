"use client";

import type { SearchMode } from "@/lib/intelligence/types";
import { useState } from "react";
import { SEARCH_MODES } from "@/lib/intelligence/search-modes";

type CompanyResult = {
  lei: string | null;
  legalName: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  registeredAs: string | null;
  jurisdiction: string | null;
  entityStatus: string | null;
  leiStatus: string | null;
  source: string;
  relevanceScore?: number;
  sourceUrl?: string | null;
};

type TradeResult = {
  type: string;
  reporterCode: number | null;
  reporterName: string | null;
  partnerCode: number | null;
  partnerName: string | null;
  flow: "imports" | "exports";
  hsCode: string;
  period: string;
  quantity: number | null;
  netWeight: number | null;
  tradeValue: number | null;
  cifValue: number | null;
  fobValue: number | null;
  estimated: boolean;
  discoveryReason: string[];
};

type SearchResponse = {
  ok: boolean;
  totalResults?: number;
  results?: CompanyResult[];
  error?: string;
};

type DiscoveryResponse = {
  ok: boolean;
  resultCount?: number;
  results?: TradeResult[];
  hsCode?: string | null;
  error?: string | null;
};

type DDResponse = {
  ok: boolean;
  company?: CompanyResult;
  checks?: { name: string; status: string; detail: string }[];
  error?: string;
};

const COUNTRIES = [
  ["", "All countries"],
  ["CA", "Canada"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["DE", "Germany"],
  ["NL", "Netherlands"],
  ["SG", "Singapore"],
  ["IN", "India"],
  ["AE", "United Arab Emirates"],
  ["TH", "Thailand"],
  ["ID", "Indonesia"],
  ["MY", "Malaysia"],
  ["CN", "China"],
  ["BR", "Brazil"],
  ["BD", "Bangladesh"],
  ["PK", "Pakistan"],
  ["TR", "Türkiye"],
  ["KR", "South Korea"],
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [tradeResults, setTradeResults] = useState<TradeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<SearchMode>("company");
  const [country, setCountry] = useState("");
  const [period, setPeriod] = useState("2025");
  const [hsCode, setHsCode] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(null);
  const [dd, setDd] = useState<DDResponse | null>(null);
  const [ddLoading, setDdLoading] = useState(false);

  async function handleSearch() {
    const search = query.trim();
    if (!search) {
      setMessage("Enter a search term.");
      return;
    }

    setLoading(true);
    setMessage("");
    setResults([]);
    setTradeResults([]);
    setSelectedCompany(null);
    setDd(null);

    try {
      const url =
        mode === "company"
          ? `/api/company-search?q=${encodeURIComponent(search)}&country=${encodeURIComponent(country)}`
          : `/api/discovery?q=${encodeURIComponent(search)}&mode=${mode}&country=${encodeURIComponent(country)}&period=${encodeURIComponent(period)}&hsCode=${encodeURIComponent(hsCode)}`;

      const response = await fetch(url);
      const data = mode === "company"
        ? (await response.json()) as SearchResponse
        : (await response.json()) as DiscoveryResponse;

      if (!response.ok || !data.ok) {
        setMessage(data.error ?? "Search failed.");
        return;
      }

      if (mode === "company") {
        const companyData = data as SearchResponse;
        setResults(companyData.results ?? []);
        setMessage(
          `Found ${companyData.totalResults ?? companyData.results?.length ?? 0} company result(s).`
        );
      } else {
        const discoveryData = data as DiscoveryResponse;
        setTradeResults(discoveryData.results ?? []);
        setMessage(
          `Found ${discoveryData.resultCount ?? discoveryData.results?.length ?? 0} trade record(s).`
        );
      }
    } catch {
      setMessage("Unable to connect to the AGE intelligence service.");
    } finally {
      setLoading(false);
    }
  }

  async function openDD(company: CompanyResult) {
    if (!company.lei) {
      setMessage("This company does not have an LEI, so the current DD record cannot be opened.");
      return;
    }

    setSelectedCompany(company);
    setDd(null);
    setDdLoading(true);

    try {
      const response = await fetch(`/api/company-dd?lei=${encodeURIComponent(company.lei)}`);
      const data = (await response.json()) as DDResponse;
      setDd(data);
    } catch {
      setDd({ ok: false, error: "Unable to load the due-diligence record." });
    } finally {
      setDdLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">AdvantEdge Global Enterprises</p>
            <h1 className="mt-2 text-2xl font-semibold">AGE Trade Intelligence</h1>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:block">Global Trade Intelligence</div>
        </header>

        <section className="py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Global • Intelligence • Due Diligence</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
            Know the company.<br />Understand the trade.<br />Verify the counterparty.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
            Search companies, discover trade markets, investigate counterparties, and keep every conclusion tied to evidence.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={SEARCH_MODES.find((x) => x.id === mode)?.placeholder ?? "Search..."}
                className="min-h-14 flex-1 rounded-xl border border-white/10 bg-slate-900 px-5 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
              <button onClick={handleSearch} disabled={loading} className="min-h-14 rounded-xl bg-cyan-400 px-8 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60">
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {SEARCH_MODES.filter((x) => x.id === "company" || x.id === "buyers" || x.id === "suppliers").map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setMode(item.id); setResults([]); setTradeResults([]); setMessage(""); }}
                  className={`rounded-full border px-5 py-2 text-sm ${mode === item.id ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-white/10 bg-white/5 text-slate-300"}`}
                >
                  {item.title.replace("Find ", "")}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white">
                {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>

              {mode !== "company" && (
                <>
                  <input value={hsCode} onChange={(e) => setHsCode(e.target.value)} placeholder="HS code (e.g. 1507)" className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none placeholder:text-slate-500" />
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">
                    {["2025","2024","2023","2022","2021","2020"].map((y) => <option key={y}>{y}</option>)}
                  </select>
                </>
              )}
              <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-4 py-3 text-xs leading-5 text-cyan-200">
                {mode === "company" ? "Filter company searches by country." : "Filter trade discovery by country, HS code and year."}
              </div>
            </div>

            {message && <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-200">{message}</div>}
          </div>
        </section>

        {results.length > 0 && (
          <section className="mb-16">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Company Results</h2>
              <span className="text-sm text-slate-500">Source: GLEIF</span>
            </div>
            <div className="grid gap-4">
              {results.map((company) => (
                <article key={company.lei ?? company.legalName} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{company.legalName ?? "Unknown legal name"}</h3>
                      <p className="mt-2 text-sm text-slate-400">{company.city ?? "Unknown city"}{company.country ? `, ${company.country}` : ""}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs text-cyan-300">{company.leiStatus ?? "Unknown status"}</span>
                      <button onClick={() => openDD(company)} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white hover:border-cyan-400">Open DD</button>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <Detail label="LEI" value={company.lei} />
                    <Detail label="Registration" value={company.registeredAs} />
                    <Detail label="Jurisdiction" value={company.jurisdiction} />
                    <Detail label="Entity Status" value={company.entityStatus} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tradeResults.length > 0 && (
          <section className="mb-16">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{mode === "buyers" ? "Buyer Market Discovery" : "Supplier Market Discovery"}</h2>
              <span className="text-sm text-slate-500">Source: UN Comtrade</span>
            </div>
            <div className="grid gap-4">
              {tradeResults.map((trade, index) => (
                <article key={`${trade.reporterCode}-${trade.partnerCode}-${trade.hsCode}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{trade.partnerName ?? "Unknown partner"}</h3>
                      <p className="mt-1 text-sm text-slate-400">{trade.reporterName ?? "Unknown reporter"} • {trade.flow}</p>
                    </div>
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1 text-xs text-amber-200">Country-level evidence</span>
                  </div>
                  <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <Detail label="HS Code" value={trade.hsCode} />
                    <Detail label="Period" value={trade.period} />
                    <Detail label="Trade Value" value={trade.tradeValue === null ? null : trade.tradeValue.toLocaleString()} />
                    <Detail label="Net Weight" value={trade.netWeight === null ? null : trade.netWeight.toLocaleString()} />
                  </div>
                  <p className="mt-4 text-xs text-slate-500">UN Comtrade identifies countries/areas, not individual companies. Company-level confirmation requires independent evidence.</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {selectedCompany && (
          <section className="mb-16 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Counterparty Due Diligence</p>
                <h2 className="mt-2 text-2xl font-semibold">{selectedCompany.legalName}</h2>
              </div>
              <button onClick={() => { setSelectedCompany(null); setDd(null); }} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Close</button>
            </div>

            {ddLoading && <p className="mt-6 text-sm text-slate-400">Loading evidence...</p>}
            {!ddLoading && dd?.ok && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(dd.checks ?? []).map((check) => (
                  <div key={check.name} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{check.name}</h3>
                      <span className="text-xs text-cyan-300">{check.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{check.detail}</p>
                  </div>
                ))}
              </div>
            )}
            {!ddLoading && dd && !dd.ok && <p className="mt-6 text-sm text-red-300">{dd.error}</p>}
          </section>
        )}

        <section className="grid gap-5 md:grid-cols-3">
          <ActionCard title="Search Company" description="Investigate legal identity, registration, jurisdiction and evidence sources." />
          <ActionCard title="Find Buyers" description="Find import markets first, then move to company-level counterparty verification." />
          <ActionCard title="Find Suppliers" description="Find export markets first, then move to company-level counterparty verification." />
        </section>

        <footer className="mt-20 border-t border-white/10 py-8 text-sm text-slate-500">AGE Trade Intelligence • AdvantEdge Global Enterprises</footer>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 break-all text-slate-300">{value ?? "—"}</p></div>;
}

function ActionCard({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-7"><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-slate-400">{description}</p></div>;
}
