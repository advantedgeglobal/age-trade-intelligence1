export type SearchMode =
  | "company"
  | "buyers"
  | "suppliers"
  | "trade"
  | "documents";

export type EvidenceSource = {
  name: string;
  url: string | null;
  collectedAt: string;
  description?: string;
};

export type CompanyProfile = {
  legalName: string | null;
  registrationNumber: string | null;
  lei: string | null;

  country: string | null;
  jurisdiction: string | null;

  addresses: {
    type: string;
    address: string;
    source?: EvidenceSource;
  }[];

  websites: string[];
  emails: string[];
  phones: string[];

  people: {
    name: string;
    role: string | null;
    source?: EvidenceSource;
  }[];

  products: {
    name: string;
    hsCode: string | null;
    source?: EvidenceSource;
  }[];

  financial: {
    revenue: string | null;
    assets: string | null;
    liabilities: string | null;
    profit: string | null;
    currency: string | null;
    period: string | null;
    source?: EvidenceSource;
  }[];

  tradeActivity: {
    direction: "import" | "export";
    product: string | null;
    hsCode: string | null;
    country: string | null;
    date: string | null;
    quantity: string | null;
    value: string | null;
    source?: EvidenceSource;
  }[];

  legalAndAdverse: {
    category: string;
    description: string;
    date: string | null;
    source?: EvidenceSource;
  }[];

  riskIndicators: {
    indicator: string;
    explanation: string;
    severity: "low" | "medium" | "high";
    source?: EvidenceSource;
  }[];

  sources: EvidenceSource[];
};

export type DiscoveryResult = {
  company: CompanyProfile;
  discoveryReason: string[];
  evidence: EvidenceSource[];
};
