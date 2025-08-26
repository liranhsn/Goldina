export {};

declare global {
  interface Window {
    api: {
      // ping
      ping: () => Promise<string>;
      // metals
      getMetalDashboard: (metal: "gold" | "silver") => Promise<{
        totalGrams: number;
        recent: { id: string; at: string; deltaGrams: number; note?: string }[];
      }>;
      addMetal: (
        metal: "gold" | "silver",
        grams: number,
        note?: string
      ) => Promise<void>;
      sellMetal: (
        metal: "gold" | "silver",
        grams: number,
        note?: string
      ) => Promise<void>;
      // accessories
      listAccessories: (
        filter: "available" | "sold" | "all"
      ) => Promise<Accessory[]>;
      addAccessory: (item: {
        type: string;
        description: string;
        price: number;
        sku?: string;
      }) => Promise<void>;
      sellAccessory: (id: string, soldPrice?: number) => Promise<void>;
    };
  }
}
