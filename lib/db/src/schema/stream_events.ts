import {
  pgTable,
  text,
  integer,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const streamEventsTable = pgTable("stream_events", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  profit: numeric("profit", { precision: 18, scale: 8 }),
  txHash: text("tx_hash"),
  blockNumber: integer("block_number"),
  protocol: text("protocol"),
});

export const insertStreamEventSchema = createInsertSchema(
  streamEventsTable,
).omit({ id: true });
export type InsertStreamEvent = z.infer<typeof insertStreamEventSchema>;
export type StreamEvent = typeof streamEventsTable.$inferSelect;
