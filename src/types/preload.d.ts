export {};

type Metal = "gold" | "silver";
type AccessoryFilter = "available" | "sold" | "all";

interface DashboardDto {
  totalGrams: number;
  recent: Array<{ at: string; deltaGrams: number; note?: string }>;
  totalGrams: number;
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
        price: number,
        note?: string
      ): Promise<DashboardDto>;
      sellMetal(
        metal: Metal,
        grams: number,
        price: number,
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

      listChecks: (opts: {
        status?: "issued" | "deposited" | "returned" | "cancelled" | "all";
        fromISO?: string;
        toISO?: string;
        search?: string;
      }) => Promise<any>;
      addCheck: (p: {
        bank: string;
        number: string;
        payee: string;
        amount: number;
        issueDateISO: string;
        dueDateISO: string;
        notes?: string;
      }) => Promise<any>;
      updateCheckStatus: (
        id: string,
        status: "issued" | "deposited" | "returned" | "cancelled"
      ) => Promise<any>;
      deleteCheck: (id: string) => Promise<any>;

      listFixedExpenses: () => Promise<any>;
      addFixedExpense: (p: { name: string; price: number }) => Promise<any>;
      updateFixedExpense: (p: {
        id: string;
        name: string;
        price: number;
      }) => Promise<any>;
      deleteFixedExpense: (id: string) => Promise<any>;
      adminUnlock: (password: string) => Promise<boolean>;
    };
  }
}
