import { NextResponse } from "next/server";
import { createEvidenceItem } from "@/lib/evidence";
import {
  queryUncomtrade,
  queryUncomtradeMany,
} from "@/lib/connectors/uncomtrade";
import { COMTRADE_REPORTERS } from "@/lib/connectors/uncomtrade-reporters";

type DiscoveryMode = "buyers" | "suppliers";

const PRODUCT_HS_MAP: Record<string, string> = {
  "soybean oil": "1507",
  "soybean oils": "1507",
  "soya oil": "1507",
  "soya bean oil": "1507",
};

const COUNTRY_CODES: Record<string, number> = {
  thailand: 764,
  india: 699,
  china: 156,
  bangladesh: 50,
  brazil: 76,
  indonesia: 360,
  malaysia: 458,
  vietnam: 704,
  "united states": 842,
  usa: 842,
  canada: 124,
  pakistan: 586,
  turkey: 792,
  germany: 276,
  netherlands: 528,
  singapore: 702,
  "south korea": 410,
  korea: 410,
};

function resolveHsCode(query: string, suppliedHsCode: string | null) {
  if (suppliedHsCode) {
    return suppliedHsCode;
  }

  return PRODUCT_HS_MAP[query.toLowerCase()] ?? null;
}

function resolveCountryCode(country: string | null) {
  if (!country) {
    return null;
  }

  const normalized = country.trim().toLowerCase();

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  return COUNTRY_CODES[normalized] ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q")?.trim();
  const mode = searchParams.get("mode") as DiscoveryMode | null;
  const suppliedHsCode = searchParams.get("hsCode")?.trim() || null;
  const country = searchParams.get("country")?.trim() || null;
  const period = searchParams.get("period")?.trim() || "2025";

  if (!query) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please provide a product or search term.",
      },
      { status: 400 }
    );
  }

  if (mode !== "buyers" && mode !== "suppliers") {
    return NextResponse.json(
      {
        ok: false,
        error: "Discovery mode must be buyers or suppliers.",
      },
      { status: 400 }
    );
  }

  const hsCode = resolveHsCode(query, suppliedHsCode);

  if (!hsCode) {
    return NextResponse.json({
      ok: true,
      mode,
      query,
      hsCode: null,
      country,
      period,
      sourceStatus: "not-checked",
      resultCount: 0,
      results: [],
      evidence: [
        createEvidenceItem(
          "AGE Trade Discovery",
          "trade-data",
          null,
          `No HS code could be resolved for "${query}".`,
          "unverified",
          [
            "The system does not guess HS codes.",
            "Provide an explicit HS code or use a supported product mapping.",
          ]
        ),
      ],
      error:
        "An HS code is required for trade discovery. Provide hsCode or use a supported product such as soybean oil.",
    });
  }

  const reporterCode = resolveCountryCode(country);
  const flow: "imports" | "exports" = mode === "buyers" ? "imports" : "exports";

  const queries = reporterCode
    ? [
        {
          hsCode,
          reporterCode,
          period,
          flow,
        },
      ]
    : COMTRADE_REPORTERS.map((reporter) => ({
        hsCode,
        reporterCode: reporter.code,
        period,
        flow,
      }));

  const result =
    queries.length === 1
      ? await queryUncomtrade(queries[0])
      : await queryUncomtradeMany(queries);

  const records =
    result.data?.records.map((record) => ({
      type: "country-trade-evidence",
      reporterCode: record.reporterCode,
      reporterName: record.reporterName,
      partnerCode: record.partnerCode,
      partnerName: record.partnerName,
      flow: record.flow,
      hsCode: record.hsCode,
      period: record.period,
      quantity: record.quantity,
      netWeight: record.netWeight,
      tradeValue: record.tradeValue,
      cifValue: record.cifValue,
      fobValue: record.fobValue,
      estimated: record.estimated,
      discoveryReason:
        mode === "buyers"
          ? [
              `Country-level import record found for HS ${record.hsCode} in ${record.period}.`,
            ]
          : [
              `Country-level export record found for HS ${record.hsCode} in ${record.period}.`,
            ],
    })) ?? [];

  const evidence = [
    ...result.evidence,
    createEvidenceItem(
      "AGE Trade Discovery",
      "trade-data",
      null,
      `Trade discovery used UN Comtrade country-level data for "${query}" (HS ${hsCode}) in ${mode} mode across ${
        queries.length
      } reporter country query(s).`,
      "high",
      [
        "A country-level import record does not establish the identity of an individual buyer.",
        "A country-level export record does not establish the identity of an individual supplier.",
        "Company discovery requires independent company-level public evidence.",
        "The current global reporter universe is an initial connector set and is not yet the complete UN Comtrade reporter universe.",
      ]
    ),
  ];

  return NextResponse.json({
    ok: result.status !== "error",
    mode,
    query,
    hsCode,
    country,
    period,
    reporterCount: queries.length,
    sourceStatus: result.status,
    resultCount: records.length,
    results: records,
    evidence,
    error: result.error ?? null,
  });
}
