import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const isSqlite = process.env.DATABASE_URL.startsWith("sqlite://");

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: isSqlite ? "sqlite" : "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
