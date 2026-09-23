export type EvidenceSourceType =
  | "company-registry"
  | "trade-data"
  | "financial-filing"
  | "sanctions"
  | "court-record"
  | "insolvency"
  | "government"
  | "company-website"
  | "other";

export type EvidenceConfidence =
  | "high"
  | "medium"
  | "low"
  | "unverified";

export type EvidenceItem = {
  sourceName: string;
  sourceType: EvidenceSourceType;
  sourceUrl: string | null;
  collectedAt: string;
  evidence: string;
  confidence: EvidenceConfidence;
  limitations?: string[];
};

export function createEvidenceItem(
  sourceName: string,
  sourceType: EvidenceSourceType,
  sourceUrl: string | null,
  evidence: string,
  confidence: EvidenceConfidence,
  limitations: string[] = []
): EvidenceItem {
  return {
    sourceName,
    sourceType,
    sourceUrl,
    collectedAt: new Date().toISOString(),
    evidence,
    confidence,
    ...(limitations.length > 0 ? { limitations } : {}),
  };
}
