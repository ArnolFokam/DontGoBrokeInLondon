/**
 * Dual-environment database client.
 *
 * - Development: better-sqlite3 against a local file (./data/financial.db)
 * - Production:  @libsql/client connecting to a Turso instance via DATABASE_URL
 *
 * Usage:
 *   import { run, all, get } from '@/lib/db'
 */

import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { createClient, type InValue } from "@libsql/client";

// ─── Types ───────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

interface DbClient {
  run(sql: string, params?: unknown[]): void | Promise<void>;
  all(sql: string, params?: unknown[]): Row[] | Promise<Row[]>;
  get(sql: string, params?: unknown[]): Row | undefined | Promise<Row | undefined>;
}

// ─── Development (better-sqlite3) ────────────────────────────────────────────

function createDevClient(): DbClient {
  const dbPath = path.resolve(process.cwd(), "data", "financial.db");
  const dataDir = path.dirname(dbPath);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");

  return {
    run(sql, params = []) {
      sqlite.prepare(sql).run(...params);
    },
    all(sql, params = []) {
      return sqlite.prepare(sql).all(...params) as Row[];
    },
    get(sql, params = []) {
      return sqlite.prepare(sql).get(...params) as Row | undefined;
    },
  };
}

// ─── Production (@libsql/client / Turso) ─────────────────────────────────────

function createProdClient(): DbClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required in production.");
  }

  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const client = createClient({ url, authToken });

  return {
    async run(sql, params = []) {
      await client.execute({ sql, args: params as InValue[] });
    },
    async all(sql, params = []) {
      const result = await client.execute({ sql, args: params as InValue[] });
      return result.rows as unknown as Row[];
    },
    async get(sql, params = []) {
      const result = await client.execute({ sql, args: params as InValue[] });
      return (result.rows[0] ?? undefined) as Row | undefined;
    },
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _db: DbClient;

function getDb(): DbClient {
  if (_db) return _db;

  try {
    _db =
      process.env.NODE_ENV === "production"
        ? createProdClient()
        : createDevClient();
  } catch (err) {
    console.error("[db] Failed to initialise database client:", err);
    throw err;
  }

  return _db;
}

export const db = new Proxy({} as DbClient, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/** Execute a write statement (INSERT / UPDATE / DELETE / DDL). */
export function run(sql: string, params: unknown[] = []) {
  return getDb().run(sql, params);
}

/** Execute a SELECT and return all matching rows. */
export function all(sql: string, params: unknown[] = []) {
  return getDb().all(sql, params);
}

/** Execute a SELECT and return the first matching row (or undefined). */
export function get(sql: string, params: unknown[] = []) {
  return getDb().get(sql, params);
}
