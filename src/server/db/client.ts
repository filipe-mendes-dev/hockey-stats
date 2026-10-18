import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseUrl } from "../environment.ts";
import * as schema from "./schema.ts";

function createDatabase() {
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 10 });
  return { pool, db: drizzle({ client: pool, schema }) };
}

interface DatabaseGlobal {
  benchlineDatabase?: ReturnType<typeof createDatabase>;
}

const databaseGlobal = globalThis as typeof globalThis & DatabaseGlobal;
const database = (databaseGlobal.benchlineDatabase ??= createDatabase());

export const db = database.db;
export const pool = database.pool;

export type DatabaseTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
