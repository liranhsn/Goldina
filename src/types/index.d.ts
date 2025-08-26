export type Metal = "gold" | "silver";
export type AccFilter = "available" | "sold" | "all";

export type MetalTx = {
  id: string;
  at: string;
  deltaGrams: number;
  note?: string;
};
export type MetalDashboard = { totalGrams: number; recent: MetalTx[] };

export type Accessory = {
  Id: string;
  Type: string;
  Description: string;
  Price: number;
  AddedAt: string;
  SoldAt?: string | null;
  SoldPrice?: number;
  Sku?: string;
};
