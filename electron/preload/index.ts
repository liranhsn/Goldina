import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  ping: () => ipcRenderer.invoke("ping"),

  getMetalDashboard: (metal: "gold" | "silver") =>
    ipcRenderer.invoke("metal:get-dashboard", metal),
  addMetal: (metal: "gold" | "silver", grams: number, note?: string) =>
    ipcRenderer.invoke("metal:add", { metal, grams, note }),
  sellMetal: (metal: "gold" | "silver", grams: number, note?: string) =>
    ipcRenderer.invoke("metal:sell", { metal, grams, note }),

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
});
