import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __rtsPool?: Pool;
  __rtsDb?: NodePgDatabase<Record<string, never>> | null;
};

// Database is optional. When DATABASE_URL is not provided (e.g. a free static
// host), the app stores learner progress in the browser instead.
let pool: Pool | null = null;
if (databaseUrl) {
  pool = globalForDb.__rtsPool ?? new Pool({ connectionString: databaseUrl });
  if (!globalForDb.__rtsPool) globalForDb.__rtsPool = pool;
}

export const db: NodePgDatabase<Record<string, never>> | null = (() => {
  if (!pool) return null;
  if (!globalForDb.__rtsDb) globalForDb.__rtsDb = drizzle(pool);
  return globalForDb.__rtsDb;
})();
