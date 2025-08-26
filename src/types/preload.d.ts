export {};

type Metal = "gold" | "silver";
type AccessoryFilter = "available" | "sold" | "all";

interface DashboardDto {
  totalGrams: number;
  recent: Array<{ at: string; deltaGrams: number; note?: string }>;
  totalGrams: number;
}

interface AccessoryItem {
  id: string;
  type: string;
  description: string;
  price: number;
  addedAt: string;
  soldAt?: string | null;
  soldPrice?: number | null;
  sku?: string | null;
}

declare global {
  interface Window {
    api: {
      ping(): Promise<string>;
      getMetalDashboard(
        metal: Metal,
        fromISO: string | undefined,
        toISO: string | undefined
      ): Promise<MetalDashboard>;
      addMetal(
        metal: Metal,
        grams: number,
        note?: string
      ): Promise<DashboardDto>;
      sellMetal(
        metal: Metal,
        grams: number,
        note?: string
      ): Promise<DashboardDto>;
      deleteMetalTx(id: string, metal: Metal): Promise<MetalDashboard>;
      listAccessories(filter: AccessoryFilter): Promise<AccessoryItem[]>;
      addAccessory(item: {
        type: string;
        description: string;
        price: number;
        sku?: string;
      }): Promise<string>;
      sellAccessory(id: string, soldPrice?: number): Promise<void>;
    };
  }
}
