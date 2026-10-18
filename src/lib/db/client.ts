/**
 * Database connection.
 *
 * - If DATABASE_URL is set (Supabase in production), we connect to it.
 * - Otherwise we use a local database stored in the ".data" folder
 *   (PGlite: real PostgreSQL running inside Node, no install needed).
 *
 * Both speak the same SQL, so the code never needs to know which one it uses.
 * Tables are created automatically on first use (see migrate.ts).
 */
import fs from "node:fs";
import path from "node:path";
import { migrate, seedDemoIfEmpty } from "./migrate";

export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  exec(sqlText: string): Promise<void>;
  close(): Promise<void>;
}

async function createPglite(dataDir?: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  let pg;
  if (dataDir === "memory://") {
    pg = new PGlite();
  } else {
    const dir = dataDir ?? path.join(process.cwd(), ".data", "pglite");
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    pg = new PGlite(dir);
  }
  await pg.waitReady;
  return {
    async query<T>(text: string, params: unknown[] = []) {
      const res = await pg.query<T>(text, params as never[]);
      return res.rows;
    },
    async exec(sqlText: string) {
      await pg.exec(sqlText);
    },
    close: () => pg.close(),
  };
}

async function createPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 5, prepare: false, ssl: url.includes("localhost") ? false : "require" });
  return {
    async query<T>(text: string, params: unknown[] = []) {
      return (await sql.unsafe(text, params as never[])) as unknown as T[];
    },
    async exec(sqlText: string) {
      await sql.unsafe(sqlText).simple();
    },
    close: () => sql.end(),
  };
}

export function createDb(options: { url?: string; dataDir?: string } = {}): Promise<Db> {
  const url = options.url ?? process.env.DATABASE_URL;
  return url ? createPostgres(url) : createPglite(options.dataDir);
}

/**
 * Demo profiles are added automatically only on the local database, or when
 * PANAX_SEED_DEMO=1 is set (e.g. a preview site before real doctors are added).
 */
function shouldSeedDemo() {
  return !process.env.DATABASE_URL || process.env.PANAX_SEED_DEMO === "1";
}

// One shared, ready-to-use connection per server process.
const globalForDb = globalThis as unknown as { __db?: Promise<Db> };
export function getDb(): Promise<Db> {
  if (!globalForDb.__db) {
    globalForDb.__db = (async () => {
      const db = await createDb();
      await migrate(db);
      if (shouldSeedDemo()) await seedDemoIfEmpty(db);
      return db;
    })().catch((e) => {
      globalForDb.__db = undefined;
      throw e;
    });
  }
  return globalForDb.__db;
}
