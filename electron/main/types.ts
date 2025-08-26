export type Metal = "gold" | "silver";
export interface MetalDashboard {
  totalGrams: number;
  recent: Array<{ at: string; deltaGrams: number; note?: string }>;
}
export type AccessoryFilter = "available" | "sold" | "all";

export type CheckStatus = "issued" | "deposited" | "returned" | "cancelled";

export interface AccessoryItem {
  id: string;
  type: string;
  description: string;
  price: number;
  addedAt: string;
  soldAt?: string | null;
  soldPrice?: number | null;
  sku?: string | null;
}

export type FixedExpense = {
  id: string;
  name: string;
  price: number;
  createdAt: string; // ISO
};
