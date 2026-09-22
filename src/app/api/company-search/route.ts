import { NextResponse } from "next/server";

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
    const gleifUrl =
      `https://api.gleif.org/api/v1/lei-records?` +
      `filter[entity.legalName]=${encodeURIComponent(query)}` +
      `page[size]=10`;

    const response = await fetch(gleifUrl, {
      headers: {
        Accept: "application/vnd.api+json",
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

    const results = (data.data ?? []).map((record: GleifRecord) => {
      const entity = record.attributes?.entity;
      const registration = record.attributes?.registration;

      return {
        lei: record.id ?? null,
        legalName: entity?.legalName?.name ?? null,

        country: entity?.legalAddress?.country ?? null,
        city: entity?.legalAddress?.city ?? null,
        region: entity?.legalAddress?.region ?? null,
        postalCode: entity?.legalAddress?.postalCode ?? null,

        legalAddress: entity?.legalAddress ?? null,
        headquartersAddress: entity?.headquartersAddress ?? null,

        registeredAs: entity?.registeredAs ?? null,
        jurisdiction: entity?.jurisdiction ?? null,

        legalForm: entity?.legalForm ?? null,

        entityStatus: entity?.entityStatus ?? null,
        leiStatus: registration?.status ?? null,

        initialRegistrationDate:
          registration?.initialRegistrationDate ?? null,

        lastUpdateDate:
          registration?.lastUpdateDate ?? null,

        nextRenewalDate:
          registration?.nextRenewalDate ?? null,

        source: "GLEIF",
        sourceUrl: record.id
          ? `https://api.gleif.org/api/v1/lei-records/${record.id}`
          : null,
      };
    });

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
