export type MonthlyResourceEstimate = { monthlyUsd: number; basis: string };
export type PricingResource = { id: string; name: string; kind: string };
export function estimateMonthlyResourceCost(resource: PricingResource, provider: string): MonthlyResourceEstimate | null;
