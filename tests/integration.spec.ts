import { describe, it, expect } from "vitest";
import { toMetalTypeInt } from "../electron/main/domain.js";
import { createRequire } from "node:module";
const nodeRequire = createRequire(import.meta.url);
const Database = nodeRequire("better-sqlite3");

function setupMemoryDb() {
  const db = new (Database as any)(":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE MetalBalance (Id TEXT PRIMARY KEY, MetalType INTEGER UNIQUE, TotalGrams REAL NOT NULL DEFAULT 0);
    CREATE TABLE MetalTransaction (Id TEXT PRIMARY KEY, MetalType INTEGER, DeltaGrams REAL, Note TEXT, At TEXT);
  `);
  db.prepare(
    "INSERT INTO MetalBalance (Id, MetalType, TotalGrams) VALUES (?, ?, 0)"
  ).run(crypto.randomUUID(), 1);
  db.prepare(
    "INSERT INTO MetalBalance (Id, MetalType, TotalGrams) VALUES (?, ?, 0)"
  ).run(crypto.randomUUID(), 2);
  return db;
}

describe("add/sell flow", () => {
  it("updates balance and writes transactions", () => {
    const db = setupMemoryDb();
    const mt = toMetalTypeInt("gold" as const);
    const now = new Date().toISOString();
    db.prepare(
      "UPDATE MetalBalance SET TotalGrams = TotalGrams + ? WHERE MetalType = ?"
    ).run(5, mt);
    db.prepare(
      "INSERT INTO MetalTransaction (Id, MetalType, DeltaGrams, Note, At) VALUES (?, ?, ?, ?, ?)"
    ).run(crypto.randomUUID(), mt, 5, "add", now);

    let bal = db
      .prepare("SELECT TotalGrams FROM MetalBalance WHERE MetalType = ?")
      .get(mt).TotalGrams;
    expect(bal).toBe(5);

    db.prepare(
      "UPDATE MetalBalance SET TotalGrams = TotalGrams - ? WHERE MetalType = ?"
    ).run(3, mt);
    db.prepare(
      "INSERT INTO MetalTransaction (Id, MetalType, DeltaGrams, Note, At) VALUES (?, ?, ?, ?, ?)"
    ).run(crypto.randomUUID(), mt, -3, "sell", now);

    bal = db
      .prepare("SELECT TotalGrams FROM MetalBalance WHERE MetalType = ?")
      .get(mt).TotalGrams;
    expect(bal).toBe(2);
  });
});
