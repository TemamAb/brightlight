import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseCandidates = [
  { key: "DATABASE_URL", value: process.env.DATABASE_URL },
  { key: "DATABASE_CONNECTION_STRING", value: process.env.DATABASE_CONNECTION_STRING },
  { key: "DATABASE_URL_FALLBACK", value: process.env.DATABASE_URL_FALLBACK },
  {
    key: "DATABASE_CONNECTION_STRING_FALLBACK",
    value: process.env.DATABASE_CONNECTION_STRING_FALLBACK,
  },
];

const selectedDatabase = databaseCandidates.find((candidate) => {
  return typeof candidate.value === "string" && candidate.value.trim().length > 0;
});

const databaseUrl = selectedDatabase?.value ?? null;

let pool: pg.Pool | null = null;
let db: any = null;

if (databaseUrl) {
  try {
    if (databaseUrl.startsWith("sqlite://")) {
      console.warn("[DB] SQLite not supported for drizzle - using mock DB");
      db = null;
    } else {
      pool = new Pool({ connectionString: databaseUrl });
      db = drizzle(pool, { schema });
      console.log(`[DB] PostgreSQL connected via ${selectedDatabase?.key ?? "unknown"}`);
    }
  } catch (err) {
    console.error("Failed to connect to database:", err);
    pool = null;
    db = null;
  }
} else {
  console.warn(
    "DATABASE_URL not set - database features disabled (checked DATABASE_URL, DATABASE_CONNECTION_STRING, DATABASE_URL_FALLBACK, DATABASE_CONNECTION_STRING_FALLBACK)",
  );
}

export { db, pool };
export default db;

export * from "./schema";
