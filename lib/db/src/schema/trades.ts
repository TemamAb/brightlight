import {
  pgTable,
  text,
  serial,
  numeric,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tradesTable = pgTable("trades", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status").notNull().default("PENDING"),
  tokenIn: text("token_in"),
  tokenOut: text("token_out"),
  amountIn: text("amount_in"),
  profit: numeric("profit", { precision: 18, scale: 8 }).notNull().default("0"),
  profitUsd: numeric("profit_usd", { precision: 18, scale: 2 }).default("0"),
  bribePaid: numeric("bribe_paid", { precision: 18, scale: 8 }).default("0"),
  gasUsed: integer("gas_used"),
  txHash: text("tx_hash"),
  protocol: text("protocol"),
  latencyMs: numeric("latency_ms", { precision: 10, scale: 3 }),
  blockNumber: integer("block_number"),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({
  id: true,
});
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
