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
  resultCount?: number;
  results?: CompanyResult[];
  error?: string;
};

type DiscoveryResponse = {
  ok: boolean;
  resultCount?: number;
  reporterCount?: number;
  results?: TradeResult[];
  hsCode?: string | null;
  country?: string | null;
  period?: string;
  error?: string | null;
};

type DDCheck = {
  name: string;
  status: string;
  detail: string;
};

type DDResponse = {
  ok: boolean;
  company?: {
    legalName?: string | null;
    identity?: {
      legalName?: string | null;
      registrationNumber?: string | null;
      lei?: string | null;
      jurisdiction?: string | null;
      legalForm?: string | null;
      entityStatus?: string | null;
      leiStatus?: string | null;
    };
    addresses?: {
      registered?: Record<string, unknown> | null;
      headquarters?: Record<string, unknown> | null;
      operating?: unknown[];
    };
    contact?: {
      website?: string | null;
      emails?: string[];
      phones?: string[];
    };
    financial?: {
      revenue?: string | null;
      assets?: string | null;
      liabilities?: string | null;
      netIncome?: string | null;
      fiscalYear?: string | null;
    };
    trade?: {
      products?: string[];
      importCountries?: string[];
      exportCountries?: string[];
      shipmentCount?: number | null;
      lastShipmentDate?: string | null;
    };
    sanctions?: {
      listed?: boolean | null;
      details?: string[];
    };
    legal?: {
      courtRecords?: unknown[];
      insolvencyRecords?: unknown[];
      regulatoryActions?: unknown[];
    };
    riskIndicators?: string[];
    evidence?: Array<{
      sourceName?: string;
      sourceType?: string;
      sourceUrl?: string | null;
      collectedAt?: string;
      evidence?: string;
      confidence?: string;
    }>;
  };
  investigationStatus?: Record<string, string>;
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

const YEARS = ["2025", "2024", "2023", "2022", "2021", "2020"];

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

  // DD UI is intentionally defensive: connected sources may omit optional arrays.


  function resetResults() {
    setResults([]);
    setTradeResults([]);
    setSelectedCompany(null);
    setDd(null);
  }

  function changeMode(nextMode: SearchMode) {
    setMode(nextMode);
    setMessage("");
    resetResults();
  }

  async function handleSearch() {
    const search = query.trim();

    if (!search) {
      setMessage(
        mode === "company"
          ? "Enter a company name, LEI, or registration number."
          : "Enter a product or HS code."
      );
      resetResults();
      return;
    }

    setLoading(true);
    setMessage("");
    resetResults();

    try {
      const params = new URLSearchParams();
      params.set("q", search);

      if (mode === "company") {
        if (country) params.set("country", country);
      } else {
        params.set("mode", mode);
        params.set("period", period);
        if (country) params.set("country", country);
        if (hsCode.trim()) params.set("hsCode", hsCode.trim());
      }

      const endpoint = mode === "company" ? "/api/company-search" : "/api/discovery";
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data = (await response.json()) as SearchResponse & DiscoveryResponse;

      if (!response.ok || !data.ok) {
        setMessage(data.error ?? "Search failed.");
        return;
      }

      if (mode === "company") {
        const companyResults = (data.results ?? []) as CompanyResult[];
        setResults(companyResults);
        setMessage(
          companyResults.length
            ? `Found ${data.totalResults ?? companyResults.length} company result(s).`
            : `No company records found for "${search}" with the selected country filter.`
        );
      } else {
        const tradeRecords = (data.results ?? []) as TradeResult[];
        setTradeResults(tradeRecords);
        setMessage(
          tradeRecords.length
            ? `Found ${data.resultCount ?? tradeRecords.length} trade record(s) across ${data.reporterCount ?? 0} reporter market(s).`
            : "No trade records were returned for the selected product, country, and period."
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
      setMessage("This company has no LEI, so the current GLEIF-based DD view cannot be opened.");
      return;
    }

    setSelectedCompany(company);
    setDd(null);
    setDdLoading(true);

    try {
      const response = await fetch(
        `/api/company-investigate?lei=${encodeURIComponent(company.lei)}`
      );
      const data = (await response.json()) as DDResponse;

      if (!response.ok || !data.ok) {
        setDd({ ok: false, error: data.error ?? "Due diligence lookup failed." });
        return;
      }

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
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
              AdvantEdge Global Enterprises
            </p>
            <h1 className="mt-2 text-2xl font-semibold">AGE Trade Intelligence</h1>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:block">
            Global Trade Intelligence
          </div>
        </header>

        <section className="py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Global • Intelligence • Due Diligence
          </p>

          <h2 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
            Know the company.
            <br />
            Understand the trade.
            <br />
            Verify the counterparty.
          </h2>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
            Search companies, discover trade markets, investigate counterparties,
            and keep every conclusion tied to evidence.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={
                  SEARCH_MODES.find((x) => x.id === mode)?.placeholder ??
                  "Search..."
                }
                className="min-h-14 flex-1 rounded-xl border border-white/10 bg-slate-900 px-5 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <button
                onClick={handleSearch}
                disabled={loading}
                className="min-h-14 rounded-xl bg-cyan-400 px-8 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {SEARCH_MODES.filter(
                (x) =>
                  x.id === "company" ||
                  x.id === "buyers" ||
                  x.id === "suppliers"
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => changeMode(item.id)}
                  className={`rounded-full border px-5 py-2 text-sm ${
                    mode === item.id
                      ? "border-cyan-400 bg-cyan-400 text-slate-950"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400"
                  }`}
                >
                  {item.id === "company"
                    ? "Companies"
                    : item.id === "buyers"
                      ? "Buyers"
                      : "Suppliers"}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"
                aria-label="Country filter"
              >
                {COUNTRIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>

              {mode !== "company" && (
                <>
                  <input
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    placeholder="HS code (e.g. 1507)"
                    inputMode="numeric"
                    className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none placeholder:text-slate-500"
                  />

                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
                    aria-label="Trade year"
                  >
                    {YEARS.map((year) => (
                      <option key={year}>{year}</option>
                    ))}
                  </select>
                </>
              )}

              <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-4 py-3 text-xs leading-5 text-cyan-200">
                {mode === "company"
                  ? "Company search: GLEIF legal-entity records, optionally filtered by country."
                  : "Trade discovery: UN Comtrade country-level evidence. It does not identify individual companies."}
              </div>
            </div>

            {message && (
              <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-200">
                {message}
              </div>
            )}
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
                <article
                  key={company.lei ?? `${company.legalName}-${company.registeredAs}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {company.legalName ?? "Unknown legal name"}
                      </h3>
                      <p className="mt-2 text-sm text-slate-400">
                        {company.city ?? "Unknown city"}
                        {company.country ? `, ${company.country}` : ""}
                        {company.region ? ` • ${company.region}` : ""}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs text-cyan-300">
                        {company.leiStatus ?? "Unknown status"}
                      </span>
                      <button
                        onClick={() => openDD(company)}
                        className="rounded-full border border-white/15 px-3 py-1 text-xs text-white hover:border-cyan-400"
                      >
                        Open DD
                      </button>
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
              <div>
                <h2 className="text-2xl font-semibold">
                  {mode === "buyers"
                    ? "Buyer Market Discovery"
                    : "Supplier Market Discovery"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Country-level trade evidence • HS {tradeResults[0]?.hsCode} • {period}
                </p>
              </div>
              <span className="text-sm text-slate-500">Source: UN Comtrade</span>
            </div>

            <div className="grid gap-4">
              {tradeResults.map((trade, index) => (
                <article
                  key={`${trade.reporterCode}-${trade.partnerCode}-${trade.hsCode}-${index}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {trade.partnerName ?? "Unknown partner"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {trade.reporterName ?? "Unknown reporter"} • {trade.flow}
                      </p>
                    </div>

                    <span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1 text-xs text-amber-200">
                      Country-level evidence
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <Detail label="HS Code" value={trade.hsCode} />
                    <Detail label="Period" value={trade.period} />
                    <Detail
                      label="Trade Value"
                      value={
                        trade.tradeValue === null
                          ? null
                          : trade.tradeValue.toLocaleString()
                      }
                    />
                    <Detail
                      label="Net Weight"
                      value={
                        trade.netWeight === null
                          ? null
                          : trade.netWeight.toLocaleString()
                      }
                    />
                  </div>

                  <p className="mt-4 text-xs text-slate-500">
                    {trade.estimated
                      ? "Some quantity/weight fields are estimated by the source."
                      : "No quantity/weight estimate flag was returned for this record."}{" "}
                    UN Comtrade identifies countries/areas, not individual companies.
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {selectedCompany && (
          <section className="mb-16 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Counterparty Due Diligence
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {selectedCompany.legalName}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Current scope: legal identity, address, contact discovery and evidence status.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedCompany(null);
                  setDd(null);
                }}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            {ddLoading && (
              <p className="mt-6 text-sm text-slate-400">
                Loading GLEIF and public-source evidence...
              </p>
            )}

            {!ddLoading && dd?.ok && dd.company && (
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <DDCard
                  title="Identity"
                  items={[
                    ["Legal name", dd.company.identity?.legalName],
                    ["LEI", dd.company.identity?.lei],
                    ["Registration", dd.company.identity?.registrationNumber],
                    ["Jurisdiction", dd.company.identity?.jurisdiction],
                    ["Legal form", dd.company.identity?.legalForm],
                    ["Entity status", dd.company.identity?.entityStatus],
                    ["LEI status", dd.company.identity?.leiStatus],
                  ]}
                />

                <DDCard
                  title="Contact"
                  items={[
                    ["Website", dd.company.contact?.website],
                    ["Emails", dd.company.contact?.emails?.join(", ")],
                    ["Phones", dd.company.contact?.phones?.join(", ")],
                  ]}
                />

                <DDCard
                  title="Addresses"
                  items={[
                    [
                      "Registered",
                      formatAddress(dd.company.addresses?.registered),
                    ],
                    [
                      "Headquarters",
                      formatAddress(dd.company.addresses?.headquarters),
                    ],
                  ]}
                />

                <DDCard
                  title="Financial"
                  items={[
                    ["Revenue", dd.company.financial?.revenue],
                    ["Assets", dd.company.financial?.assets],
                    ["Liabilities", dd.company.financial?.liabilities],
                    ["Net income", dd.company.financial?.netIncome],
                    ["Fiscal year", dd.company.financial?.fiscalYear],
                  ]}
                />

                <DDCard
                  title="Trade"
                  items={[
                    ["Products", dd.company.trade?.products?.join(", ")],
                    ["Import countries", dd.company.trade?.importCountries?.join(", ")],
                    ["Export countries", dd.company.trade?.exportCountries?.join(", ")],
                    ["Shipment count", dd.company.trade?.shipmentCount?.toString()],
                    ["Last shipment", dd.company.trade?.lastShipmentDate],
                  ]}
                />

                <DDCard
                  title="Sanctions"
                  items={[
                    [
                      "Listed",
                      dd.company.sanctions?.listed === null ||
                      dd.company.sanctions?.listed === undefined
                        ? "Not checked"
                        : dd.company.sanctions.listed
                          ? "Yes"
                          : "No",
                    ],
                    ["Details", dd.company.sanctions?.details?.join(" ")],
                  ]}
                />

                <DDCard
                  title="Investigation status"
                  items={Object.entries(dd.investigationStatus ?? {}).map(
                    ([name, status]) => [name, status]
                  )}
                />

                <DDCard
                  title="Risk indicators"
                  items={
                    (dd.company.riskIndicators ?? []).length > 0
                      ? (dd.company.riskIndicators ?? []).map((item, index) => [
                          `Indicator ${index + 1}`,
                          item,
                        ])
                      : [["Current result", "No risk indicator has been asserted by the connected sources."]]
                  }
                />

                <DDCard
                  title="Evidence"
                  items={
                    (dd.company.evidence ?? []).length > 0
                      ? (dd.company.evidence ?? []).map((item, index) => [
                          `${item.sourceName ?? "Source"} #${index + 1}`,
                          item.evidence ?? "Evidence record available",
                        ])
                      : [["Sources", "No evidence records returned."]]
                  }
                />
              </div>
            )}

            {!ddLoading && dd && !dd.ok && (
              <p className="mt-6 text-sm text-red-300">{dd.error}</p>
            )}

            {!ddLoading && dd?.ok && (
              <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
                <strong>DD limitation:</strong> the current connected sources do not yet
                prove financial strength, shipment history, sanctions clearance, beneficial
                ownership, court history, or fraud status. Those sections remain explicitly
                marked as not connected rather than being guessed.
              </div>
            )}
          </section>
        )}

        <section className="grid gap-5 md:grid-cols-3">
          <ActionCard
            title="Search Company"
            description="Search legal entities globally, filter by country, and open a structured counterparty DD record."
          />
          <ActionCard
            title="Find Buyers"
            description="Search import markets by product, HS code, country and year before moving to company-level verification."
          />
          <ActionCard
            title="Find Suppliers"
            description="Search export markets by product, HS code, country and year before moving to company-level verification."
          />
        </section>

        <footer className="mt-20 border-t border-white/10 py-8 text-sm text-slate-500">
          AGE Trade Intelligence • AdvantEdge Global Enterprises
        </footer>
      </div>
    </main>
  );
}

function formatAddress(address: Record<string, unknown> | null | undefined) {
  if (!address) return null;

  const parts = [
    ...(Array.isArray(address.addressLines) ? address.addressLines : []),
    address.city,
    address.region,
    address.postalCode,
    address.country,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return parts.length ? parts.join(", ") : null;
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 break-all text-slate-300">{value ?? "—"}</p>
    </div>
  );
}

function DDCard({
  title,
  items,
}: {
  title: string;
  items: [string, string | null | undefined][];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-1 break-words text-sm text-slate-300">
              {value || "Not available"}
            </p>
          </div>
        ))}
      </div>
    </div>
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 leading-7 text-slate-400">{description}</p>
    </div>
  );
}
