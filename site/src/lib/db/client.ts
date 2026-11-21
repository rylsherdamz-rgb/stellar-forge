// Minimal database seam: a query/exec/transaction interface that both
// `postgres` (production, Supabase-compatible) and PGlite (tests) satisfy.

import { readFileSync, readdirSync } from "fs";
import path from "path";
import type { Sql, TransactionSql } from "postgres";

export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  /** Run multi-statement SQL with no parameters (migrations). */
  exec(text: string): Promise<void>;
  tx<R>(fn: (db: Db) => Promise<R>): Promise<R>;
}

let shared: Promise<Db> | null = null;
let override: Db | null = null;

export function dbEnabled(): boolean {
  return !!override || !!process.env.DATABASE_URL;
}

/** Tests inject a PGlite-backed Db here. */
export function setDbForTests(db: Db | null): void {
  override = db;
  shared = null;
}

export async function getDb(): Promise<Db> {
  if (override) return override;
  shared ??= (async () => {
    const { default: postgres } = await import("postgres");
    // prepare:false keeps it compatible with Supabase's transaction pooler.
    const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 5 });
    const wrap = (s: Sql | TransactionSql): Db => ({
      query: async <T>(text: string, params: unknown[] = []) =>
        (await s.unsafe(text, params as never[])) as unknown as T[],
      exec: async (text: string) => {
        await s.unsafe(text);
      },
      tx: async <R>(fn: (db: Db) => Promise<R>) => {
        if (!("begin" in s)) return fn(wrap(s)); // already inside a transaction
        return (await s.begin((t) => fn(wrap(t)))) as R;
      },
    });
    const db = wrap(sql);
    await migrate(db);
    return db;
  })();
  return shared;
}

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

/** Apply db/migrations/*.sql in order, once each, under an advisory lock. */
export async function migrate(db: Db, dir = MIGRATIONS_DIR): Promise<string[]> {
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const applied: string[] = [];
  await db.tx(async (t) => {
    await t.query("select pg_advisory_xact_lock(727274)");
    await t.exec(
      "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const done = new Set(
      (await t.query<{ name: string }>("select name from schema_migrations")).map((r) => r.name),
    );
    for (const f of files) {
      if (done.has(f)) continue;
      await t.exec(readFileSync(path.join(dir, f), "utf8"));
      await t.query("insert into schema_migrations (name) values ($1)", [f]);
      applied.push(f);
    }
  });
  return applied;
}
