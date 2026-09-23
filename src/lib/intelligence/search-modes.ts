import type { SearchMode } from "./types";

export type SearchModeConfig = {
  id: SearchMode;
  title: string;
  description: string;
  placeholder: string;
};

export const SEARCH_MODES: SearchModeConfig[] = [
  {
    id: "company",
    title: "Search Company",
    description:
      "Investigate a company using its name, registration number, LEI, website, email, phone, or person.",
    placeholder: "Company name, registration number, LEI, website, email, phone, or person...",
  },
  {
    id: "buyers",
    title: "Find Buyers",
    description:
      "Discover potential buyers globally by product, HS code, market, geography, and available trade evidence.",
    placeholder: "Product, HS code, country, or market...",
  },
  {
    id: "suppliers",
    title: "Find Suppliers",
    description:
      "Discover potential suppliers and manufacturers globally using products, HS codes, markets, geography, and trade evidence.",
    placeholder: "Product, HS code, country, or market...",
  },
];
