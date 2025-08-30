import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  ping: () => ipcRenderer.invoke("ping"),

  getMetalDashboard: (
    metal: "gold" | "silver",
    fromISO?: string,
    toISO?: string
  ) => ipcRenderer.invoke("metal:get-dashboard", { metal, fromISO, toISO }),
  addMetal: (
    metal: "gold" | "silver",
    grams: number,
    price: number,
    note?: string
  ) => ipcRenderer.invoke("metal:add", { metal, grams, price, note }),
  sellMetal: (
    metal: "gold" | "silver",
    grams: number,
    price: number,
    note?: string
  ) => ipcRenderer.invoke("metal:sell", { metal, grams, price, note }),
  deleteMetalTx: (id: string, metal: "gold" | "silver") =>
    ipcRenderer.invoke("metal:delete-tx", { id, metal }),

  listAccessories: (filter: "available" | "sold" | "all") =>
    ipcRenderer.invoke("acc:list", filter),
  addAccessory: (item: {
    type: string;
    description: string;
    price: number;
    sku?: string;
  }) => ipcRenderer.invoke("acc:add", item),
  sellAccessory: (id: string, soldPrice?: number) =>
    ipcRenderer.invoke("acc:sell", { id, soldPrice }),

  listChecks: (opts: {
    status?: "issued" | "deposited" | "returned" | "cancelled" | "all";
    fromISO?: string;
    toISO?: string;
    search?: string;
  }) => ipcRenderer.invoke("checks:list", opts),
  addCheck: (p: {
    bank: string;
    number: string;
    payee: string;
    amount: number;
    issueDateISO: string;
    dueDateISO: string;
    notes?: string;
  }) => ipcRenderer.invoke("checks:add", p),
  updateCheckStatus: (
    id: string,
    status: "issued" | "deposited" | "returned" | "cancelled"
  ) => ipcRenderer.invoke("checks:update-status", { id, status }),
  deleteCheck: (id: string) => ipcRenderer.invoke("checks:delete", id),

  listFixedExpenses: () => ipcRenderer.invoke("fx:list"),
  addFixedExpense: (p: { name: string; price: number }) =>
    ipcRenderer.invoke("fx:add", p),
  updateFixedExpense: (p: { id: string; name: string; price: number }) =>
    ipcRenderer.invoke("fx:update", p),
  deleteFixedExpense: (id: string) => ipcRenderer.invoke("fx:delete", id),
  adminUnlock: (password: string) =>
    ipcRenderer.invoke("admin:unlock", password),
});
