import { createEvidenceItem } from "@/lib/evidence";
import type {
  ConnectorResult,
  TradeDiscoveryData,
  TradeDiscoveryRecord,
} from "./types";
import { COMTRADE_REPORTERS } from "./uncomtrade-reporters";

type ComtradeRecord = {
  reporterCode?: number | null;
  reporterISO?: string | null;
  reporterDesc?: string | null;
  partnerCode?: number | null;
  partnerISO?: string | null;
  partnerDesc?: string | null;
  partner2Code?: number | null;
  cmdCode?: string | null;
  period?: string | null;
  flowCode?: string | null;
  qty?: number | null;
  netWgt?: number | null;
  primaryValue?: number | null;
  cifvalue?: number | null;
  fobvalue?: number | null;
  isQtyEstimated?: boolean | null;
  isNetWgtEstimated?: boolean | null;
  isAggregate?: boolean | null;
};

type ComtradeResponse = {
  count?: number;
  data?: ComtradeRecord[];
};

export type UncomtradeQuery = {
  hsCode: string;
  reporterCode: number;
  period: string;
  flow: "imports" | "exports";
  partnerCode?: number;
};

const COMTRADE_BASE_URL =
  "https://comtradeapi.un.org/public/v1/preview/C/A/HS";

const COUNTRY_NAMES = new Map(
  COMTRADE_REPORTERS.map((reporter) => [reporter.code, reporter.name])
);

const KNOWN_COMTRADE_COUNTRIES = new Map<number, string>([
  [0, "World"],
  [4, "Afghanistan"],
  [8, "Albania"],
  [12, "Algeria"],
  [20, "Andorra"],
  [24, "Angola"],
  [28, "Antigua and Barbuda"],
  [31, "Azerbaijan"],
  [32, "Argentina"],
  [36, "Australia"],
  [40, "Austria"],
  [44, "Bahamas"],
  [48, "Bahrain"],
  [50, "Bangladesh"],
  [51, "Armenia"],
  [52, "Barbados"],
  [56, "Belgium"],
  [60, "Bermuda"],
  [64, "Bhutan"],
  [68, "Bolivia"],
  [70, "Bosnia and Herzegovina"],
  [72, "Botswana"],
  [76, "Brazil"],
  [84, "Belize"],
  [100, "Bulgaria"],
  [104, "Myanmar"],
  [108, "Burundi"],
  [116, "Cambodia"],
  [120, "Cameroon"],
  [124, "Canada"],
  [132, "Cabo Verde"],
  [140, "Central African Republic"],
  [144, "Sri Lanka"],
  [148, "Chad"],
  [152, "Chile"],
  [156, "China"],
  [170, "Colombia"],
  [174, "Comoros"],
  [175, "Mayotte"],
  [178, "Republic of the Congo"],
  [180, "Democratic Republic of the Congo"],
  [188, "Costa Rica"],
  [191, "Croatia"],
  [192, "Cuba"],
  [196, "Cyprus"],
  [203, "Czechia"],
  [204, "Benin"],
  [208, "Denmark"],
  [212, "Dominica"],
  [214, "Dominican Republic"],
  [218, "Ecuador"],
  [222, "El Salvador"],
  [226, "Equatorial Guinea"],
  [231, "Ethiopia"],
  [232, "Eritrea"],
  [233, "Estonia"],
  [234, "Faroe Islands"],
  [238, "Falkland Islands"],
  [242, "Fiji"],
  [246, "Finland"],
  [250, "France"],
  [251, "France"],
  [254, "French Guiana"],
  [258, "French Polynesia"],
  [262, "Djibouti"],
  [266, "Gabon"],
  [268, "Georgia"],
  [270, "Gambia"],
  [276, "Germany"],
  [288, "Ghana"],
  [292, "Gibraltar"],
  [300, "Greece"],
  [304, "Greenland"],
  [308, "Grenada"],
  [312, "Guadeloupe"],
  [316, "Guam"],
  [320, "Guatemala"],
  [324, "Guinea"],
  [328, "Guyana"],
  [332, "Haiti"],
  [336, "Holy See"],
  [340, "Honduras"],
  [344, "Hong Kong"],
  [348, "Hungary"],
  [352, "Iceland"],
  [356, "India"],
  [360, "Indonesia"],
  [364, "Iran"],
  [368, "Iraq"],
  [372, "Ireland"],
  [376, "Israel"],
  [380, "Italy"],
  [384, "Côte d'Ivoire"],
  [388, "Jamaica"],
  [392, "Japan"],
  [398, "Kazakhstan"],
  [400, "Jordan"],
  [404, "Kenya"],
  [408, "North Korea"],
  [410, "South Korea"],
  [414, "Kuwait"],
  [417, "Kyrgyzstan"],
  [418, "Laos"],
  [422, "Lebanon"],
  [426, "Lesotho"],
  [428, "Latvia"],
  [430, "Liberia"],
  [434, "Libya"],
  [438, "Liechtenstein"],
  [440, "Lithuania"],
  [442, "Luxembourg"],
  [446, "Macao"],
  [450, "Madagascar"],
  [454, "Malawi"],
  [458, "Malaysia"],
  [462, "Maldives"],
  [466, "Mali"],
  [470, "Malta"],
  [478, "Mauritania"],
  [480, "Mauritius"],
  [484, "Mexico"],
  [492, "Monaco"],
  [496, "Mongolia"],
  [498, "Moldova"],
  [499, "Montenegro"],
  [504, "Morocco"],
  [508, "Mozambique"],
  [512, "Oman"],
  [516, "Namibia"],
  [520, "Nauru"],
  [524, "Nepal"],
  [528, "Netherlands"],
  [531, "Curaçao"],
  [533, "Aruba"],
  [534, "Sint Maarten"],
  [548, "Vanuatu"],
  [554, "New Zealand"],
  [558, "Nicaragua"],
  [562, "Niger"],
  [566, "Nigeria"],
  [570, "Niue"],
  [578, "Norway"],
  [580, "Northern Mariana Islands"],
  [583, "Micronesia"],
  [584, "Marshall Islands"],
  [585, "Palau"],
  [586, "Pakistan"],
  [591, "Panama"],
  [598, "Papua New Guinea"],
  [600, "Paraguay"],
  [604, "Peru"],
  [608, "Philippines"],
  [616, "Poland"],
  [620, "Portugal"],
  [624, "Guinea-Bissau"],
  [626, "Timor-Leste"],
  [630, "Puerto Rico"],
  [634, "Qatar"],
  [638, "Réunion"],
  [642, "Romania"],
  [643, "Russia"],
  [646, "Rwanda"],
  [659, "Saint Kitts and Nevis"],
  [660, "Anguilla"],
  [662, "Saint Lucia"],
  [666, "Saint Pierre and Miquelon"],
  [670, "Saint Vincent and the Grenadines"],
  [674, "San Marino"],
  [678, "Sao Tome and Principe"],
  [682, "Saudi Arabia"],
  [686, "Senegal"],
  [688, "Serbia"],
  [690, "Seychelles"],
  [694, "Sierra Leone"],
  [702, "Singapore"],
  [703, "Slovakia"],
  [705, "Slovenia"],
  [706, "Somalia"],
  [710, "South Africa"],
  [716, "Zimbabwe"],
  [724, "Spain"],
  [728, "South Sudan"],
  [729, "Sudan"],
  [732, "Western Sahara"],
  [740, "Suriname"],
  [748, "Eswatini"],
  [752, "Sweden"],
  [756, "Switzerland"],
  [760, "Syria"],
  [762, "Tajikistan"],
  [764, "Thailand"],
  [768, "Togo"],
  [776, "Tonga"],
  [780, "Trinidad and Tobago"],
  [784, "United Arab Emirates"],
  [788, "Tunisia"],
  [792, "Türkiye"],
  [795, "Turkmenistan"],
  [796, "Turks and Caicos Islands"],
  [798, "Tuvalu"],
  [800, "Uganda"],
  [804, "Ukraine"],
  [807, "North Macedonia"],
  [818, "Egypt"],
  [826, "United Kingdom"],
  [831, "Guernsey"],
  [832, "Jersey"],
  [833, "Isle of Man"],
  [834, "Tanzania"],
  [836, "United States Minor Outlying Islands"],
  [840, "United States"],
  [842, "United States"],
  [850, "U.S. Virgin Islands"],
  [854, "Burkina Faso"],
  [858, "Uruguay"],
  [860, "Uzbekistan"],
  [862, "Venezuela"],
  [876, "Wallis and Futuna"],
  [882, "Samoa"],
  [887, "Yemen"],
  [894, "Zambia"],
]);

function getFlowCode(flow: UncomtradeQuery["flow"]) {
  return flow === "imports" ? "M" : "X";
}

function getCountryName(
  code: number | null | undefined,
  apiName: string | null | undefined,
  apiIso: string | null | undefined
) {
  if (apiName) return apiName;
  if (apiIso) return apiIso;

  if (code !== null && code !== undefined) {
    return (
      COUNTRY_NAMES.get(code) ??
      KNOWN_COMTRADE_COUNTRIES.get(code) ??
      `Area code ${code}`
    );
  }

  return null;
}

function normalizeRecord(
  record: ComtradeRecord,
  query: UncomtradeQuery
): TradeDiscoveryRecord {
  const reporterCode = record.reporterCode ?? query.reporterCode;
  const partnerCode = record.partnerCode ?? null;

  return {
    reporterCode,
    reporterName: getCountryName(
      reporterCode,
      record.reporterDesc,
      record.reporterISO
    ),
    partnerCode,
    partnerName: getCountryName(
      partnerCode,
      record.partnerDesc,
      record.partnerISO
    ),
    hsCode: record.cmdCode ?? query.hsCode,
    period: record.period ?? query.period,
    flow: query.flow,
    quantity: record.qty ?? null,
    netWeight: record.netWgt ?? null,
    tradeValue: record.primaryValue ?? null,
    cifValue: record.cifvalue ?? null,
    fobValue: record.fobvalue ?? null,
    estimated:
      Boolean(record.isQtyEstimated) || Boolean(record.isNetWgtEstimated),
  };
}

function isUsefulTradeRecord(record: ComtradeRecord) {
  /*
   * Comtrade can return several observations for the same reporter/partner
   * because of secondary dimensions such as partner2, mode of transport,
   * customs code, etc.
   *
   * For AGE's country-level discovery layer we want the aggregate observation,
   * not every underlying dimension.
   */
  return record.isAggregate === true;
}

function aggregateRecords(
  records: TradeDiscoveryRecord[]
): TradeDiscoveryRecord[] {
  const groups = new Map<string, TradeDiscoveryRecord>();

  for (const record of records) {
    const key = [
      record.reporterCode,
      record.partnerCode,
      record.hsCode,
      record.period,
      record.flow,
    ].join("|");

    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, { ...record });
      continue;
    }

    /*
     * Keep the aggregate observation rather than adding dimensional rows.
     * If duplicate aggregate observations exist, retain the first complete
     * observation to avoid double-counting trade value and quantity.
     */
    if (
      existing.tradeValue === null &&
      record.tradeValue !== null
    ) {
      existing.tradeValue = record.tradeValue;
    }

    if (existing.quantity === null && record.quantity !== null) {
      existing.quantity = record.quantity;
    }

    if (existing.netWeight === null && record.netWeight !== null) {
      existing.netWeight = record.netWeight;
    }

    existing.estimated = existing.estimated || record.estimated;
  }

  return Array.from(groups.values());
}

export async function queryUncomtrade(
  query: UncomtradeQuery
): Promise<ConnectorResult<TradeDiscoveryData>> {
  const apiKey = process.env.UNCOMTRADE_API_KEY;

  if (!apiKey) {
    return {
      status: "error",
      data: null,
      evidence: [],
      error: "UNCOMTRADE_API_KEY is not configured.",
    };
  }

  const params = new URLSearchParams({
    cmdCode: query.hsCode,
    flowCode: getFlowCode(query.flow),
    reporterCode: String(query.reporterCode),
    period: query.period,
  });

  if (query.partnerCode !== undefined) {
    params.set("partnerCode", String(query.partnerCode));
  }

  const sourceUrl = `${COMTRADE_BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        Accept: "application/json",
        "Ocp-Apim-Subscription-Key": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        status: "error",
        data: null,
        evidence: [],
        error: `UN Comtrade returned HTTP ${response.status}.`,
      };
    }

    const payload = (await response.json()) as ComtradeResponse;

    if (!Array.isArray(payload.data)) {
      return {
        status: "error",
        data: null,
        evidence: [],
        error: "UN Comtrade returned an unexpected response format.",
      };
    }

    const aggregateRows = payload.data.filter(isUsefulTradeRecord);
    const normalizedRecords = aggregateRows.map((record) =>
      normalizeRecord(record, query)
    );
    const records = aggregateRecords(normalizedRecords);

    const evidence = [
      createEvidenceItem(
        "UN Comtrade",
        "trade-data",
        sourceUrl,
        `UN Comtrade returned ${payload.data.length} raw country-level observation(s), of which ${aggregateRows.length} were aggregate observations. AGE retained ${records.length} country-level discovery record(s) for HS ${query.hsCode}, ${query.flow}, reporter code ${query.reporterCode}, period ${query.period}.`,
        "high",
        [
          "UN Comtrade is country-level trade data and does not by itself identify an individual buyer or supplier company.",
          "The API can return multiple observations for secondary dimensions such as partner2 and mode of transport.",
          "AGE uses aggregate observations for country-level discovery to avoid double-counting dimensional records.",
          "Country/area names are resolved from AGE's Comtrade area-code dictionary when the API does not provide descriptions.",
          "Coverage varies by reporter, partner, product, period, and reporting practices.",
          "Some quantities or weights may be estimated.",
        ]
      ),
    ];

    return {
      status: records.length > 0 ? "available" : "not-found",
      data: {
        records,
      },
      evidence,
    };
  } catch {
    return {
      status: "error",
      data: null,
      evidence: [],
      error: "Unable to connect to UN Comtrade.",
    };
  }
}

export async function queryUncomtradeMany(
  queries: UncomtradeQuery[]
): Promise<ConnectorResult<TradeDiscoveryData>> {
  if (queries.length === 0) {
    return {
      status: "not-found",
      data: { records: [] },
      evidence: [],
    };
  }

  const results = await Promise.all(
    queries.map((query) => queryUncomtrade(query))
  );

  const records = aggregateRecords(
    results.flatMap((result) => result.data?.records ?? [])
  );

  const evidence = results.flatMap((result) => result.evidence);

  const errors = results
    .map((result) => result.error)
    .filter((error): error is string => Boolean(error));

  return {
    status:
      records.length > 0
        ? "available"
        : errors.length === results.length
          ? "error"
          : "not-found",
    data: {
      records,
    },
    evidence,
    ...(errors.length > 0
      ? { error: `${errors.length} Comtrade query(s) failed.` }
      : {}),
  };
}
