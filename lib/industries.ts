export const INDUSTRY_OPTIONS = [
  "Legal",
  "Restaurant",
  "Cafe",
  "Retail",
  "Dental",
  "Healthcare",
  "Finance",
  "Real Estate",
  "Wholesale",
  "Logistics",
  "Software",
  "Fitness",
  "Beauty & Wellness",
  "Construction",
] as const

export type Industry = (typeof INDUSTRY_OPTIONS)[number]
