export type Metal = "gold" | "silver";
export type AccFilter = "available" | "sold" | "all";

export type MetalTx = {
  id: string;
  at: string;
  deltaGrams: number;
  price: number;
  note?: string;
};
export type MetalDashboard = { totalGrams: number; recent: MetalTx[] };
