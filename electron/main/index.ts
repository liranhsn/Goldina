import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { db } from "./db.js";
import type { Metal, AccessoryFilter } from "./types.js";

let win: BrowserWindow;

async function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });
  if (!app.isPackaged) {
    await win.loadURL(process.env.ELECTRON_RENDERER_URL!);
    // win.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexHtml = path.join(__dirname, "../../dist/renderer/index.html");
    await win.loadFile(indexHtml);
  }

  win.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error("did-fail-load:", code, desc, url);
  });
}

app.whenReady().then(createWindow);

ipcMain.handle("ping", async () => "pong");

ipcMain.handle(
  "metal:get-dashboard",
  (_e, payload: { metal: Metal; fromISO?: string; toISO?: string }) =>
    db.getMetalDashboard(payload.metal, payload.fromISO, payload.toISO)
);

ipcMain.handle(
  "metal:add",
  (
    _e,
    payload: { metal: Metal; grams: number; price: number; note?: string }
  ) => {
    db.addMetalGrams(payload.metal, payload.grams, payload.price, payload.note);
    return db.getMetalDashboard(payload.metal);
  }
);

ipcMain.handle(
  "metal:sell",
  (
    _e,
    payload: { metal: Metal; grams: number; price: number; note?: string }
  ) => {
    db.sellMetalGrams(
      payload.metal,
      payload.grams,
      payload.price,
      payload.note
    );
    return db.getMetalDashboard(payload.metal);
  }
);

ipcMain.handle(
  "metal:delete-tx",
  (_e, payload: { id: string; metal: "gold" | "silver" }) => {
    db.deleteMetalTransaction(payload.id, payload.metal);
    return db.getMetalDashboard(payload.metal);
  }
);

ipcMain.handle("acc:list", (_e, filter: AccessoryFilter) =>
  db.listAccessories(filter)
);

ipcMain.handle(
  "acc:add",
  (
    _e,
    item: { type: string; description: string; price: number; sku?: string }
  ) => db.addAccessory(item)
);

ipcMain.handle("acc:sell", (_e, payload: { id: string; soldPrice?: number }) =>
  db.sellAccessory(payload.id, payload.soldPrice)
);

ipcMain.handle(
  "checks:list",
  (
    _e,
    payload: {
      status?: string;
      fromISO?: string;
      toISO?: string;
      search?: string;
    }
  ) => db.listChecks(payload as any)
);

ipcMain.handle(
  "checks:add",
  (
    _e,
    payload: {
      bank: string;
      number: string;
      payee: string;
      amount: number;
      issueDateISO: string;
      dueDateISO: string;
      notes?: string;
    }
  ) => db.addCheck(payload)
);

ipcMain.handle(
  "checks:update-status",
  (
    _e,
    payload: {
      id: string;
      status: "issued" | "deposited" | "returned" | "cancelled";
    }
  ) => db.updateCheckStatus(payload.id, payload.status)
);

ipcMain.handle("checks:delete", (_e, id: string) => db.deleteCheck(id));

ipcMain.handle("fx:list", () => db.listFixedExpenses());
ipcMain.handle("fx:add", (_e, p: { name: string; price: number }) =>
  db.addFixedExpense(p)
);
ipcMain.handle(
  "fx:update",
  (_e, p: { id: string; name: string; price: number }) =>
    db.updateFixedExpense(p)
);
ipcMain.handle("fx:delete", (_e, id: string) => db.deleteFixedExpense(id));
