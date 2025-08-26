/* Use createRequire so we can require native addon from ESM */
import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import { createRequire } from "node:module";
const nodeRequire = createRequire(import.meta.url);
const Database = nodeRequire("better-sqlite3");

import { toMetalTypeInt, ensurePositiveGrams } from "./domain.js";
import type {
  Metal,
  MetalDashboard,
  AccessoryFilter,
  AccessoryItem,
} from "./types.js";

const DB_DIR = app.getPath("userData");
const DB_PATH = path.join(DB_DIR, "data.db");

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export class Db {
  private db: any;

  constructor() {
    ensureDir(DB_DIR);
    this.db = new Database(DB_PATH);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS MetalBalance (
        Id TEXT PRIMARY KEY,
        MetalType INTEGER NOT NULL UNIQUE,
        TotalGrams REAL NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS MetalTransaction (
        Id TEXT PRIMARY KEY,
        MetalType INTEGER NOT NULL,
        DeltaGrams REAL NOT NULL,
        Note TEXT,
        At TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IX_MetalTransaction_MetalType_At
        ON MetalTransaction (MetalType, At DESC);

      CREATE TABLE IF NOT EXISTS AccessoryItem (
        Id TEXT PRIMARY KEY,
        Type TEXT NOT NULL,
        Description TEXT NOT NULL,
        Price REAL NOT NULL,
        AddedAt TEXT NOT NULL,
        SoldAt TEXT NULL,
        SoldPrice REAL NULL,
        Sku TEXT NULL
      );
      CREATE INDEX IF NOT EXISTS IX_AccessoryItem_SoldAt ON AccessoryItem (SoldAt);
      CREATE INDEX IF NOT EXISTS IX_AccessoryItem_Type_SoldAt ON AccessoryItem (Type, SoldAt);
    `);
    const row = this.db.prepare("SELECT COUNT(*) AS c FROM MetalBalance").get();
    const count = row ? (row.c as number) : 0;
    if (count === 0) {
      const stmt = this.db.prepare(
        "INSERT INTO MetalBalance (Id, MetalType, TotalGrams) VALUES (?, ?, ?)"
      );
      stmt.run(crypto.randomUUID(), 1, 0);
      stmt.run(crypto.randomUUID(), 2, 0);
    }
  }

  getMetalDashboard(metal: Metal, fromISO?: string, toISO?: string) {
    const metalInt = metal === "gold" ? 1 : 2;
    const totalRow = this.db
      .prepare(
        "SELECT TotalGrams as total FROM MetalBalance WHERE MetalType = ?"
      )
      .get(metalInt);
    const totalGrams = totalRow?.total ?? 0;

    let sql = `
    SELECT Id as id, At as at, DeltaGrams as deltaGrams, Note as note
    FROM MetalTransaction
    WHERE MetalType = ?
  `;
    const params: any[] = [metalInt];

    if (fromISO) {
      sql += " AND At >= ?";
      params.push(fromISO);
    }
    if (toISO) {
      sql += " AND At < ?";
      params.push(toISO);
    }

    sql += " ORDER BY At DESC LIMIT 200"; // אפשר להתאים

    const recent = this.db.prepare(sql).all(...params);
    return { totalGrams, recent };
  }

  // getMetalDashboard(metal: Metal): MetalDashboard {
  //   const mt = toMetalTypeInt(metal);
  //   const row = this.db
  //     .prepare("SELECT TotalGrams FROM MetalBalance WHERE MetalType = ?")
  //     .get(mt);
  //   const balanceGrams = row ? (row.TotalGrams as number) : 0;
  //   const recent = this.db
  //     .prepare(
  //       `
  //     SELECT At, DeltaGrams, Note
  //     FROM MetalTransaction
  //     WHERE MetalType = ?
  //     ORDER BY At DESC
  //     LIMIT 20
  //   `
  //     )
  //     .all(mt)
  //     .map((r: any) => ({
  //       at: r.At as string,
  //       deltaGrams: r.DeltaGrams as number,
  //       note: r.Note as string | undefined,
  //     }));
  //   return { balanceGrams, recent };
  // }

  addMetalGrams(metal: Metal, grams: number, note?: string) {
    ensurePositiveGrams(grams);
    const mt = toMetalTypeInt(metal);
    const now = new Date().toISOString();
    const trx = this.db.transaction(() => {
      this.db
        .prepare(
          "UPDATE MetalBalance SET TotalGrams = TotalGrams + ? WHERE MetalType = ?"
        )
        .run(grams, mt);
      this.db
        .prepare(
          "INSERT INTO MetalTransaction (Id, MetalType, DeltaGrams, Note, At) VALUES (?, ?, ?, ?, ?)"
        )
        .run(crypto.randomUUID(), mt, grams, note ?? null, now);
    });
    trx();
  }

  sellMetalGrams(metal: Metal, grams: number, note?: string) {
    ensurePositiveGrams(grams);
    const mt = toMetalTypeInt(metal);
    const bal =
      (this.db
        .prepare("SELECT TotalGrams FROM MetalBalance WHERE MetalType = ?")
        .get(mt)?.TotalGrams as number) ?? 0;
    if (bal - grams < 0) throw new Error("Cannot sell: insufficient grams");
    const now = new Date().toISOString();
    const trx = this.db.transaction(() => {
      this.db
        .prepare(
          "UPDATE MetalBalance SET TotalGrams = TotalGrams - ? WHERE MetalType = ?"
        )
        .run(grams, mt);
      this.db
        .prepare(
          "INSERT INTO MetalTransaction (Id, MetalType, DeltaGrams, Note, At) VALUES (?, ?, ?, ?, ?)"
        )
        .run(crypto.randomUUID(), mt, -grams, note ?? null, now);
    });
    trx();
  }

  deleteMetalTransaction(id: string, metal: Metal) {
    const metalInt = toMetalTypeInt(metal);

    const txRow = this.db
      .prepare(
        "SELECT MetalType, DeltaGrams FROM MetalTransaction WHERE Id = ?"
      )
      .get(id);

    if (!txRow) throw new Error("העסקה לא נמצאה");
    if (txRow.MetalType !== metalInt) throw new Error("סוג מתכת לא תואם");

    const balRow = this.db
      .prepare("SELECT TotalGrams FROM MetalBalance WHERE MetalType = ?")
      .get(metalInt);
    const current = balRow?.TotalGrams ?? 0;

    const newTotal = current - txRow.DeltaGrams; // מסירים את ההשפעה הקודמת
    if (newTotal < -1e-9) {
      throw new Error("מחיקה תגרום ליתרה שלילית. הפעולה נמנעה.");
    }

    const run = this.db.transaction(() => {
      this.db
        .prepare("UPDATE MetalBalance SET TotalGrams = ? WHERE MetalType = ?")
        .run(newTotal, metalInt);
      this.db.prepare("DELETE FROM MetalTransaction WHERE Id = ?").run(id);
    });

    run();
  }

  listAccessories(filter: AccessoryFilter): AccessoryItem[] {
    let sql = `SELECT Id, Type, Description, Price, AddedAt, SoldAt, SoldPrice, Sku FROM AccessoryItem`;
    if (filter === "available") sql += ` WHERE SoldAt IS NULL`;
    if (filter === "sold") sql += ` WHERE SoldAt IS NOT NULL`;
    sql += ` ORDER BY COALESCE(SoldAt, AddedAt) DESC`;
    return this.db.prepare(sql).all();
  }

  addAccessory(item: {
    type: string;
    description: string;
    price: number;
    sku?: string | null;
  }) {
    if (!item.type?.trim()) throw new Error("Type required");
    if (!item.description?.trim()) throw new Error("Description required");
    if (!(item.price >= 0)) throw new Error("Price must be >= 0");
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `
      INSERT INTO AccessoryItem (Id, Type, Description, Price, AddedAt, SoldAt, SoldPrice, Sku)
      VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)
    `
      )
      .run(
        id,
        item.type.trim(),
        item.description.trim(),
        item.price,
        now,
        item.sku ?? null
      );
    return id;
  }

  sellAccessory(id: string, soldPrice?: number) {
    const row = this.db
      .prepare("SELECT SoldAt, Price FROM AccessoryItem WHERE Id = ?")
      .get(id);
    if (!row) throw new Error("Item not found");
    if (row.SoldAt) throw new Error("Item already sold");
    const price = (soldPrice ?? row.Price) as number;
    if (!(price >= 0)) throw new Error("SoldPrice must be >= 0");
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE AccessoryItem SET SoldAt = ?, SoldPrice = ? WHERE Id = ?`
      )
      .run(now, price, id);
  }
}

export const db = new Db();
