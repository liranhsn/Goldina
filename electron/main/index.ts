import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { db } from "./db.js";
import type { Metal, AccessoryFilter } from "./types.js";

let win: BrowserWindow;

async function createWindow() {
  win = new BrowserWindow({
    width: 1200,
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
    win.webContents.openDevTools({ mode: "detach" });
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

// ipcMain.handle("metal:get-dashboard", (_e, metal: Metal) =>
//   db.getMetalDashboard(metal)
// );

ipcMain.handle(
  "metal:get-dashboard",
  (_e, payload: { metal: Metal; fromISO?: string; toISO?: string }) =>
    db.getMetalDashboard(payload.metal, payload.fromISO, payload.toISO)
);

ipcMain.handle(
  "metal:add",
  (_e, payload: { metal: Metal; grams: number; note?: string }) => {
    db.addMetalGrams(payload.metal, payload.grams, payload.note);
    return db.getMetalDashboard(payload.metal);
  }
);

ipcMain.handle(
  "metal:sell",
  (_e, payload: { metal: Metal; grams: number; note?: string }) => {
    db.sellMetalGrams(payload.metal, payload.grams, payload.note);
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
