export type ConnectorDefinition = {
  id: string;
  name: string;
  category:
    | "company"
    | "website"
    | "financial"
    | "trade"
    | "sanctions"
    | "legal"
    | "insolvency"
    | "people";
  description: string;
  global: boolean;
  free: boolean;
  enabled: boolean;
};

export const CONNECTORS: ConnectorDefinition[] = [
  {
    id: "gleif",
    name: "GLEIF",
    category: "company",
    description: "Global Legal Entity Identifier records.",
    global: true,
    free: true,
    enabled: true,
  },
  {
    id: "company-website-discovery",
    name: "Company Website Discovery",
    category: "website",
    description:
      "Find and validate publicly available company websites and domains.",
    global: true,
    free: true,
    enabled: true,
  },
  {
    id: "financial-filings",
    name: "Financial Filings",
    category: "financial",
    description:
      "Public financial statements and regulatory filings where available.",
    global: true,
    free: true,
    enabled: false,
  },
  {
    id: "trade-data",
    name: "Trade Data",
    category: "trade",
    description:
      "Lawful trade and shipment data used for buyer and supplier discovery.",
    global: true,
    free: true,
    enabled: false,
  },
  {
    id: "sanctions",
    name: "Sanctions Screening",
    category: "sanctions",
    description:
      "Government and international sanctions screening sources.",
    global: true,
    free: true,
    enabled: false,
  },
  {
    id: "legal-records",
    name: "Legal and Regulatory Records",
    category: "legal",
    description:
      "Public court, regulatory and enforcement information where available.",
    global: true,
    free: true,
    enabled: false,
  },
  {
    id: "insolvency",
    name: "Insolvency Records",
    category: "insolvency",
    description:
      "Public insolvency, liquidation and bankruptcy information where available.",
    global: true,
    free: true,
    enabled: false,
  },
  {
    id: "people",
    name: "People and Management",
    category: "people",
    description:
      "Publicly available directors, officers and key-person information.",
    global: true,
    free: true,
    enabled: false,
  },
];
