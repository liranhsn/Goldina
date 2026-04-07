import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import { createRequire } from "node:module";
import { db } from "./db.js";
import type { Metal, AccessoryFilter } from "./types.js";

const nodeRequire = createRequire(import.meta.url);
const { autoUpdater } = nodeRequire("electron-updater");

const ADMIN_PASSWORD = "2468";

let win: BrowserWindow;

function iconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "logo.ico")
    : path.join(process.cwd(), "build", "icons", "logo.ico");
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 800,
    icon: iconPath(),
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

app.whenReady().then(async () => {
  await createWindow();
  if (app.isPackaged) {
    setupAutoUpdater();
  }
});

const GITHUB_OWNER = "liranhsn";
const GITHUB_REPO = "Goldina";
const UPDATE_TOKEN = process.env.UPDATE_TOKEN ?? "";

function setupAutoUpdater() {
  autoUpdater.setFeedURL({
    provider: "github",
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    private: true,
    token: UPDATE_TOKEN,
  });

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-downloaded", () => {
    const choice = dialog.showMessageBoxSync(win, {
      type: "info",
      title: "עדכון מוכן להתקנה",
      message: "גרסה חדשה של Goldina הורדה.\nהאם להפעיל מחדש ולהתקין עכשיו?",
      buttons: ["הפעל מחדש", "מאוחר יותר"],
      defaultId: 0,
      cancelId: 1,
    });
    if (choice === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on("error", (err: Error) => {
    console.error("Auto-updater error:", err);
  });

  autoUpdater.checkForUpdates();
}

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
  "metal:update-tx",
  (
    _e,
    payload: {
      id: string;
      metal: "gold" | "silver";
      grams: number;
      price: number;
      note?: string;
    }
  ) => {
    db.updateMetalTransaction(
      payload.id,
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

ipcMain.handle(
  "acc:update",
  (
    _e,
    payload: {
      id: string;
      type: string;
      description: string;
      price: number;
      sku?: string | null;
    }
  ) => db.updateAccessory(payload.id, payload)
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
  "checks:update",
  (
    _e,
    payload: {
      id: string;
      bank: string;
      number: string;
      payee: string;
      amount: number;
      issueDateISO: string;
      dueDateISO: string;
      notes?: string;
    }
  ) => db.updateCheck(payload.id, payload)
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

ipcMain.handle("admin:unlock", async (_e, password: string) => {
  // super-basic compare; replace with stronger logic later if you want
  return password === ADMIN_PASSWORD;
});
