import type { EvidenceItem } from "@/lib/evidence";

export type CompanyProfile = {
  identity: {
    legalName: string | null;
    registrationNumber: string | null;
    lei: string | null;
    jurisdiction: string | null;
    legalForm: string | null;
    status: string | null;
  };

  addresses: {
    registered: string | null;
    headquarters: string | null;
    operating: string[];
  };

  contact: {
    website: string | null;
    emails: string[];
    phones: string[];
  };

  people: {
    name: string;
    role: string | null;
    sourceUrl: string | null;
  }[];

  financial: {
    revenue: number | null;
    currency: string | null;
    assets: number | null;
    liabilities: number | null;
    netIncome: number | null;
    fiscalYear: string | null;
    sourceUrl: string | null;
  };

  trade: {
    products: string[];
    importCountries: string[];
    exportCountries: string[];
    shipmentCount: number | null;
    lastShipmentDate: string | null;
    sourceUrl: string | null;
  };

  legal: {
    courtRecords: string[];
    insolvencyRecords: string[];
    regulatoryActions: string[];
  };

  sanctions: {
    listed: boolean | null;
    details: string[];
  };

  riskIndicators: {
    category: string;
    description: string;
    severity: "low" | "medium" | "high";
    sourceUrl: string | null;
  }[];

  evidence: EvidenceItem[];
};
