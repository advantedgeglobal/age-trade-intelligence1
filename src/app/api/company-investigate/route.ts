import { NextResponse } from "next/server";
import { createEvidenceItem } from "@/lib/evidence";
import { discoverCompanyWebsite } from "@/lib/connectors/company-website";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lei = searchParams.get("lei")?.trim();

  if (!lei) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please provide a company LEI.",
      },
      { status: 400 }
    );
  }

  try {
    const url = `https://api.gleif.org/api/v1/lei-records/${encodeURIComponent(
      lei
    )}`;

    const response = await fetch(url, {
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

    const data = await response.json();

    const record = data?.data;
    const entity = record?.attributes?.entity;
    const registration = record?.attributes?.registration;

    if (!record || !entity) {
      return NextResponse.json(
        {
          ok: false,
          error: "GLEIF returned no usable company record.",
        },
        { status: 404 }
      );
    }

    const legalName = entity?.legalName?.name ?? null;

    const sourceUrl = `https://api.gleif.org/api/v1/lei-records/${lei}`;

    const gleifEvidence = createEvidenceItem(
      "GLEIF",
      "company-registry",
      sourceUrl,
      "Legal entity information retrieved from the GLEIF LEI record.",
      "high",
      [
        "This source does not by itself establish financial strength, solvency, trading activity, fraud history, sanctions status, or beneficial ownership.",
      ]
    );

    const websiteDiscovery = await discoverCompanyWebsite({
      legalName: legalName ?? "",
      country: entity?.legalAddress?.country ?? null,
      registrationNumber: entity?.registeredAs ?? null,
      lei,
    });

    const evidence = [
      gleifEvidence,
      ...websiteDiscovery.evidence,
    ];

    return NextResponse.json({
      ok: true,

      company: {
        legalName,

        identity: {
          legalName,
          registrationNumber: entity?.registeredAs ?? null,
          lei,
          jurisdiction: entity?.jurisdiction ?? null,
          legalForm:
            entity?.legalForm?.other ??
            entity?.legalForm?.id ??
            null,
          entityStatus: entity?.entityStatus ?? null,
          leiStatus: registration?.status ?? null,
        },

        addresses: {
          registered: entity?.legalAddress ?? null,
          headquarters: entity?.headquartersAddress ?? null,
          operating: [],
        },

        contact: {
          website: websiteDiscovery.data?.website ?? null,
          emails: websiteDiscovery.data?.emails ?? [],
          phones: websiteDiscovery.data?.phones ?? [],
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
          products: websiteDiscovery.data?.products ?? [],
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

        evidence,
      },

      investigationStatus: {
        identity: "available",
        addresses: "available",
        contact: websiteDiscovery.status,
        people: "not-yet-connected",
        financial: "not-yet-connected",
        trade: "not-yet-connected",
        legal: "not-yet-connected",
        sanctions: "not-yet-connected",
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to connect to the company investigation service.",
      },
      { status: 502 }
    );
  }
}
