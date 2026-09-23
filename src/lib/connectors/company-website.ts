import { createEvidenceItem } from "@/lib/evidence";
import type {
  CompanyDiscoveryInput,
  ConnectorResult,
  ContactDiscoveryData,
} from "./types";

export async function discoverCompanyWebsite(
  input: CompanyDiscoveryInput
): Promise<ConnectorResult<ContactDiscoveryData>> {
  const searchName = input.legalName.trim();

  if (!searchName) {
    return {
      status: "not-found",
      data: null,
      evidence: [],
    };
  }

  /*
   * This connector intentionally does not guess a website.
   *
   * A future search connector will supply candidate URLs from
   * lawful public sources. This layer will then fetch and verify
   * those candidates.
   */

  const data: ContactDiscoveryData = {
    website: null,
    domains: [],
    emails: [],
    phones: [],
    addresses: [],
    description: null,
    products: [],
  };

  const evidence = [
    createEvidenceItem(
      "AGE Website Discovery",
      "company-website",
      null,
      `Website discovery has been initialized for "${searchName}". No website is asserted until an independent public source identifies and supports the domain.`,
      "unverified",
      [
        "No website has been verified yet.",
        "The absence of a discovered website does not establish that the company has no website.",
      ]
    ),
  ];

  return {
    status: "not-checked",
    data,
    evidence,
  };
}
