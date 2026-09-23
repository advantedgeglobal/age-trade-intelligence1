import { NextResponse } from "next/server";
import { createEvidenceItem } from "@/lib/evidence";
import type { CompanyProfile } from "@/lib/company";

type GleifRecord = {
  id?: string;
  attributes?: {
    entity?: {
      legalName?: {
        name?: string;
      };
      legalAddress?: {
        country?: string;
        city?: string;
        region?: string;
        postalCode?: string;
        addressLines?: string[];
      };
      headquartersAddress?: {
        country?: string;
        city?: string;
        region?: string;
        postalCode?: string;
        addressLines?: string[];
      };
      legalForm?: {
        id?: string;
        other?: string | null;
      };
      registeredAs?: string;
      jurisdiction?: string;
      entityStatus?: string;
    };
    registration?: {
      status?: string;
      initialRegistrationDate?: string;
      lastUpdateDate?: string;
      nextRenewalDate?: string;
    };
  };
};

type GleifResponse = {
  data?: GleifRecord[];
  meta?: {
    pagination?: {
      total?: number;
    };
  };
};

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
  legalForm: {
    id?: string;
    other?: string | null;
  } | null;
  source: string;
  sourceUrl: string | null;
  relevanceScore: number;
  evidence: ReturnType<typeof createEvidenceItem>[];
};

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreCompany(name: string, query: string, legalForm?: string | null) {
  const companyName = normalize(name);
  const searchTerm = normalize(query);
  const form = normalize(legalForm);

  if (!companyName || !searchTerm) return 0;

  let score = 0;

  // Exact legal-name match
  if (companyName === searchTerm) {
    score += 1000;
  }

  // Starts with the searched company name
  if (companyName.startsWith(searchTerm)) {
    score += 500;
  }

  // Exact phrase contained in the name
  if (companyName.includes(searchTerm)) {
    score += 250;
  }

  // Reward individual query words
  const words = searchTerm.split(" ").filter(Boolean);

  for (const word of words) {
    if (companyName.split(" ").includes(word)) {
      score += 100;
    } else if (companyName.includes(word)) {
      score += 25;
    }
  }

  // Penalize common non-operating-company entities for ordinary company searches
  const noiseTerms = [
    "fund",
    "etf",
    "trust",
    "pension",
    "401",
    "yield shares",
    "investment fund",
    "index fund",
  ];

  for (const term of noiseTerms) {
    if (companyName.includes(term) || form.includes(term)) {
      score -= 250;
    }
  }

  // Prefer actual company legal forms
  const companyForms = [
    "company",
    "corporation",
    "limited",
    "ltd",
    "inc",
    "incorporated",
    "llc",
    "limited liability",
    "spółka",
    "gesellschaft",
    "société",
  ];

  if (companyForms.some((term) => form.includes(term) || companyName.includes(term))) {
    score += 50;
  }

  return score;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please provide a company search term.",
      },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams();

    params.set("filter[fulltext]", query);
    params.set("page[size]", "50");

    const gleifUrl =
      `https://api.gleif.org/api/v1/lei-records?${params.toString()}`;

    const response = await fetch(gleifUrl, {
      headers: {
        Accept: "application/vnd.api+json",
        "User-Agent": "AGE-Trade-Intelligence/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `GLEIF returned HTTP ${response.status}.`,
        },
        { status: 502 }
      );
    }

    const data = (await response.json()) as GleifResponse;

    const results: CompanyResult[] = (data.data ?? [])
      .map((record: GleifRecord) => {
        const entity = record.attributes?.entity;
        const registration = record.attributes?.registration;

        const legalName = entity?.legalName?.name ?? null;
        const legalForm = entity?.legalForm ?? null;

        return {
          lei: record.id ?? null,
          legalName,

          country: entity?.legalAddress?.country ?? null,
          city: entity?.legalAddress?.city ?? null,
          region: entity?.legalAddress?.region ?? null,
          postalCode: entity?.legalAddress?.postalCode ?? null,

          registeredAs: entity?.registeredAs ?? null,
          jurisdiction: entity?.jurisdiction ?? null,

          entityStatus: entity?.entityStatus ?? null,
          leiStatus: registration?.status ?? null,

          legalForm,

          source: "GLEIF",

          sourceUrl: record.id
            ? `https://api.gleif.org/api/v1/lei-records/${record.id}`
            : null,

          evidence: [
            createEvidenceItem(
              "GLEIF",
              "company-registry",
              record.id
                ? `https://api.gleif.org/api/v1/lei-records/${record.id}`
                : null,
              "Legal entity information retrieved from the Global Legal Entity Identifier Foundation (GLEIF) LEI record.",
              "high",
              [
                "GLEIF data does not by itself establish financial strength, solvency, trading activity, fraud history, or absence of sanctions."
              ]
            ),
          ],

          relevanceScore: scoreCompany(
            legalName ?? "",
            query,
            legalForm?.other
          ),

          profile: {
            identity: {
              legalName,
              registrationNumber: entity?.registeredAs ?? null,
              lei: record.id ?? null,
              jurisdiction: entity?.jurisdiction ?? null,
              legalForm: legalForm?.other ?? legalForm?.id ?? null,
              status: entity?.entityStatus ?? registration?.status ?? null,
            },

            addresses: {
              registered: entity?.legalAddress
                ? [
                    ...(entity.legalAddress.addressLines ?? []),
                    entity.legalAddress.city,
                    entity.legalAddress.region,
                    entity.legalAddress.postalCode,
                    entity.legalAddress.country,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : null,

              headquarters: entity?.headquartersAddress
                ? [
                    ...(entity.headquartersAddress.addressLines ?? []),
                    entity.headquartersAddress.city,
                    entity.headquartersAddress.region,
                    entity.headquartersAddress.postalCode,
                    entity.headquartersAddress.country,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : null,

              operating: [],
            },

            contact: {
              website: null,
              emails: [],
              phones: [],
            },

            people: [],

            financial: {
              revenue: null,
              currency: null,
              assets: null,
              liabilities: null,
              netIncome: null,
              fiscalYear: null,
              sourceUrl: null,
            },

            trade: {
              products: [],
              importCountries: [],
              exportCountries: [],
              shipmentCount: null,
              lastShipmentDate: null,
              sourceUrl: null,
            },

            legal: {
              courtRecords: [],
              insolvencyRecords: [],
              regulatoryActions: [],
            },

            sanctions: {
              listed: null,
              details: [],
            },

            riskIndicators: [],

            evidence: [
              createEvidenceItem(
                "GLEIF",
                "company-registry",
                record.id
                  ? `https://api.gleif.org/api/v1/lei-records/${record.id}`
                  : null,
                "Legal entity information retrieved from the Global Legal Entity Identifier Foundation (GLEIF) LEI record.",
                "high",
                [
                  "GLEIF data does not by itself establish financial strength, solvency, trading activity, fraud history, or absence of sanctions."
                ]
              ),
            ],
          } satisfies CompanyProfile,
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);

    return NextResponse.json({
      ok: true,
      query,
      source: "GLEIF",
      resultCount: results.length,
      totalResults: data.meta?.pagination?.total ?? results.length,
      results,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to connect to GLEIF.",
      },
      { status: 502 }
    );
  }
}
