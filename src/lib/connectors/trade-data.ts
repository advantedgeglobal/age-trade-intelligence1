import { createEvidenceItem, type EvidenceItem } from "@/lib/evidence";
import type { ConnectorResult } from "./types";

export type TradeDiscoveryMode = "buyers" | "suppliers";

export type TradeDiscoveryInput = {
  mode: TradeDiscoveryMode;
  query: string;
  hsCode?: string | null;
  country?: string | null;
};

export type TradeDiscoveryResult = {
  companyName: string;
  country: string | null;
  city: string | null;
  product: string | null;
  hsCode: string | null;
  role: "buyer" | "supplier";
  evidence: EvidenceItem[];
};

export type TradeDiscoveryData = {
  results: TradeDiscoveryResult[];
  totalResults: number;
};

export async function discoverTradeCompanies(
  input: TradeDiscoveryInput
): Promise<ConnectorResult<TradeDiscoveryData>> {
  const query = input.query.trim();

  if (!query) {
    return {
      status: "not-found",
      data: null,
      evidence: [],
    };
  }

  /*
   * Trade discovery is deliberately connector-driven.
   *
   * Do not invent buyer/supplier companies from search-engine results,
   * company names, or assumptions.
   *
   * A future public trade-data connector will populate this structure
   * with actual shipment/trade evidence and its source URL.
   */

  const data: TradeDiscoveryData = {
    results: [],
    totalResults: 0,
  };

  const evidence = [
    createEvidenceItem(
      "AGE Trade Discovery",
      "trade-data",
      null,
      `Trade discovery has been initialized for "${query}" in ${input.mode} mode.`,
      "unverified",
      [
        "No buyer or supplier is asserted until an independent trade-data source identifies the company.",
        "Company names must not be inferred from product searches alone.",
        "Trade-data availability varies by country, product, reporting period, and source."
      ]
    ),
  ];

  return {
    status: "not-checked",
    data,
    evidence,
  };
}
