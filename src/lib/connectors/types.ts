import type { EvidenceItem } from "@/lib/evidence";

export type ConnectorStatus =
  | "available"
  | "not-found"
  | "not-checked"
  | "error";

export type ConnectorResult<T> = {
  status: ConnectorStatus;
  data: T | null;
  evidence: EvidenceItem[];
  error?: string;
};

export type CompanyDiscoveryInput = {
  legalName: string;
  country?: string | null;
  registrationNumber?: string | null;
  lei?: string | null;
};

export type ContactDiscoveryData = {
  website: string | null;
  domains: string[];
  emails: string[];
  phones: string[];
  addresses: string[];
  description: string | null;
  products: string[];
};

export type TradeDiscoveryRecord = {
  reporterCode: number | null;
  reporterName: string | null;
  partnerCode: number | null;
  partnerName: string | null;
  hsCode: string;
  period: string;
  flow: "imports" | "exports";
  quantity: number | null;
  netWeight: number | null;
  tradeValue: number | null;
  cifValue: number | null;
  fobValue: number | null;
  estimated: boolean;
};

export type TradeDiscoveryData = {
  records: TradeDiscoveryRecord[];
};
