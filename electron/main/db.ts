/* Use createRequire so we can require native addon from ESM */
import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import { createRequire } from "node:module";
const nodeRequire = createRequire(import.meta.url);
const Database = nodeRequire("better-sqlite3");

import { toMetalTypeInt, ensurePositiveGrams, statusToInt } from "./domain.js";
import type {
  Metal,
  AccessoryFilter,
  AccessoryItem,
  CheckStatus,
  FixedExpense,
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
        Price INTEGER NOT NULL,
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

     
      CREATE TABLE IF NOT EXISTS CheckItem (
      Id TEXT PRIMARY KEY,
      Bank TEXT NOT NULL,
      Number TEXT NOT NULL,
      Payee TEXT NOT NULL,
      Amount REAL NOT NULL,
      IssueDate TEXT NOT NULL,  -- ISO8601
      DueDate TEXT NOT NULL,    -- ISO8601
      Status INTEGER NOT NULL,  -- 1=Issued, 2=Deposited, 3=Returned, 4=Cancelled
      Notes TEXT,
      DepositedAt TEXT,
      ClearedAt TEXT
    );


    CREATE TABLE IF NOT EXISTS FixedExpense (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    Price REAL NOT NULL,
    CreatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS IX_CheckItem_DueDate ON CheckItem(DueDate);
    CREATE INDEX IF NOT EXISTS IX_CheckItem_Status ON CheckItem(Status);
    CREATE INDEX IF NOT EXISTS IX_AccessoryItem_SoldAt ON AccessoryItem (SoldAt);
    CREATE INDEX IF NOT EXISTS IX_AccessoryItem_Type_SoldAt ON AccessoryItem (Type, SoldAt);
    CREATE INDEX IF NOT EXISTS IX_FixedExpense_Name ON FixedExpense(Name);

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
    SELECT Id as id, At as at, DeltaGrams as deltaGrams, Price as price, Note as note
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

  addMetalGrams(metal: Metal, grams: number, price: number, note?: string) {
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
          "INSERT INTO MetalTransaction (Id, MetalType, DeltaGrams,Price, Note, At) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .run(crypto.randomUUID(), mt, grams, price, note ?? null, now);
    });
    trx();
  }

  sellMetalGrams(metal: Metal, grams: number, price: number, note?: string) {
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
          "INSERT INTO MetalTransaction (Id, MetalType, DeltaGrams, Price, Note, At) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .run(crypto.randomUUID(), mt, -grams, price, note ?? null, now);
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
    let sql = `SELECT Id as id, Type as type, Description as description, Price as price, AddedAt as addedAt, SoldAt as soldAt, SoldPrice as soldPrice, Sku as sku FROM AccessoryItem`;
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

  addCheck(payload: {
    bank: string;
    number: string;
    payee: string;
    amount: number;
    issueDateISO: string;
    dueDateISO: string;
    notes?: string;
  }) {
    // Basic guards (fast fail before hitting DB)
    if (!payload.number?.trim()) throw new Error("Missing check number");
    if (!payload.payee?.trim()) throw new Error("Missing payee");
    if (!payload.bank?.trim()) throw new Error("Missing Bank");

    if (!(typeof payload.amount === "number" && payload.amount > 0)) {
      throw new Error("Amount must be > 0");
    }

    const id = crypto.randomUUID();

    try {
      const stmt = this.db.prepare(`
      INSERT INTO CheckItem
        (Id, Bank , Number, Payee, Amount, IssueDate, DueDate, Status, Notes)
      VALUES
        (@Id, @Bank, @Number, @Payee, @Amount, @IssueDate, @DueDate, 1, @Notes)
    `);

      const info = stmt.run({
        Id: id,
        Bank: payload.bank.trim(),
        Number: payload.number.trim(),
        Payee: payload.payee.trim(),
        Amount: payload.amount,
        IssueDate: payload.issueDateISO,
        DueDate: payload.dueDateISO,
        Notes: payload.notes ?? null,
      });

      // 2) Verify the write actually happened
      if (info.changes !== 1) {
        // This would be unusual unless INSERT OR IGNORE or similar is used
        throw new Error("Insert failed (no rows affected)");
      }

      // 3) Optional: read back to confirm and return the new row
      const row = this.db
        .prepare(
          `SELECT Id as id, Bank as bank, Number as number, Payee as payee, Amount as amount,
                IssueDate as issueDate, DueDate as dueDate, Status as status, Notes as notes
         FROM CheckItem WHERE Id = ?`
        )
        .get(id);

      if (!row) throw new Error("Insert verification failed");
      return { ok: true as const, id, item: row };
    } catch (err: any) {
      // Log and normalize the error for upstream (IPC/renderer)
      console.error("addCheck failed:", err);
      return { ok: false as const, error: err?.message ?? String(err) };
    }
  }

  listChecks(filter: {
    status?: CheckStatus | "all";
    fromISO?: string; // accept "YYYY-MM-DD" or full ISO
    toISO?: string; // accept "YYYY-MM-DD" or full ISO
    search?: string;
  }) {
    const params: any[] = [];
    let sql = `
    SELECT Id as id,  Bank as bank, Number as number, Payee as payee, Amount as amount,
           IssueDate as issueDate, DueDate as dueDate,
           Status as statusInt, Notes as notes, DepositedAt as depositedAt, ClearedAt as clearedAt
    FROM CheckItem
    WHERE 1=1
  `;

    if (filter.status && filter.status !== "all") {
      sql += " AND Status = ?";
      params.push(statusToInt(filter.status));
    }

    // Normalize to YYYY-MM-DD (first 10 chars) and compare as strings
    const toYMD = (s?: string) => (s ? s.slice(0, 10) : undefined);

    let fromYMD = toYMD(filter.fromISO);
    let toYMDVal = toYMD(filter.toISO);

    // Guard: if user flipped range, swap it
    if (fromYMD && toYMDVal && fromYMD > toYMDVal) {
      const tmp = fromYMD;
      fromYMD = toYMDVal;
      toYMDVal = tmp;
    }

    if (fromYMD) {
      sql += " AND substr(DueDate,1,10) >= ?";
      params.push(fromYMD);
    }
    if (toYMDVal) {
      sql += " AND substr(DueDate,1,10) <= ?";
      params.push(toYMDVal);
    }

    if (filter.search) {
      sql += " AND (Number LIKE ? OR Payee LIKE ?)";
      const q = `%${filter.search}%`;
      params.push(q, q);
    }

    sql += " ORDER BY DueDate ASC, Number ASC";

    // --- Debug snapshot to see what's actually in the DB ---
    const bounds = this.db
      .prepare(
        `SELECT MIN(substr(DueDate,1,10)) AS minDue, MAX(substr(DueDate,1,10)) AS maxDue FROM CheckItem`
      )
      .get();

    const rows = this.db.prepare(sql).all(...params);

    return rows.map((r: any) => ({
      ...r,
      status:
        r.statusInt === 1
          ? "issued"
          : r.statusInt === 2
          ? "deposited"
          : r.statusInt === 3
          ? "returned"
          : "cancelled",
    })) as Array<{
      id: string;
      number: string;
      payee: string;
      amount: number;
      issueDate: string;
      dueDate: string;
      status: CheckStatus;
      notes?: string | null;
      depositedAt?: string | null;
      clearedAt?: string | null;
    }>;
  }

  updateCheckStatus(id: string, status: CheckStatus) {
    const now = new Date().toISOString();
    const s = statusToInt(status);

    const row = this.db
      .prepare("SELECT Status FROM CheckItem WHERE Id = ?")
      .get(id) as { Status?: number } | undefined;
    if (!row) throw new Error("הצ׳ק לא נמצא");

    // סט שדות זמן נלווים
    let sql = "UPDATE CheckItem SET Status = ?";
    const values: any[] = [s];

    if (status === "deposited") {
      sql += ", DepositedAt = ?";
      values.push(now);
    }
    if (status === "returned" || status === "cancelled") {
      // לא מאתחלים DepositedAt כאן, אפשר להשאיר היסטוריה
    }
    sql += " WHERE Id = ?";
    values.push(id);

    this.db.prepare(sql).run(...values);
  }

  deleteCheck(id: string) {
    this.db.prepare("DELETE FROM CheckItem WHERE Id = ?").run(id);
  }

  addFixedExpense(payload: { name: string; price: number }) {
    if (!payload.name?.trim()) throw new Error("יש להזין שם הוצאה");
    const price = Number(payload.price);
    if (!(price >= 0)) throw new Error("מחיר חייב להיות מספר ≥ 0");

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
    INSERT INTO FixedExpense (Id, Name, Price, CreatedAt)
    VALUES (@Id, @Name, @Price, @CreatedAt)
  `);
    const info = stmt.run({
      Id: id,
      Name: payload.name.trim(),
      Price: price,
      CreatedAt: now,
    });
    if (info.changes !== 1) throw new Error("הוספה נכשלה");
    return id;
  }

  listFixedExpenses(): FixedExpense[] {
    const rows = this.db
      .prepare(
        `SELECT Id as id, Name as name, Price as price, CreatedAt as createdAt
       FROM FixedExpense
       ORDER BY Name COLLATE NOCASE ASC`
      )
      .all();
    return rows;
  }

  updateFixedExpense(payload: { id: string; name: string; price: number }) {
    if (!payload.id) throw new Error("חסר מזהה");
    if (!payload.name?.trim()) throw new Error("יש להזין שם הוצאה");
    const price = Number(payload.price);
    if (!(price >= 0)) throw new Error("מחיר חייב להיות מספר ≥ 0");

    const info = this.db
      .prepare(`UPDATE FixedExpense SET Name = ?, Price = ? WHERE Id = ?`)
      .run(payload.name.trim(), price, payload.id);
    if (info.changes !== 1) throw new Error("עדכון נכשל");
  }

  deleteFixedExpense(id: string) {
    if (!id) throw new Error("חסר מזהה");
    const info = this.db
      .prepare(`DELETE FROM FixedExpense WHERE Id = ?`)
      .run(id);
    if (info.changes !== 1) throw new Error("מחיקה נכשלה");
  }
}

export const db = new Db();
