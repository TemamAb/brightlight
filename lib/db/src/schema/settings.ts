import { pgTable, text, numeric, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  flashLoanSizeEth: numeric("flash_loan_size_eth", { precision: 18, scale: 4 })
    .notNull()
    .default("100"),
  minMarginPct: numeric("min_margin_pct", { precision: 6, scale: 2 })
    .notNull()
    .default("15"),
  maxBribePct: numeric("max_bribe_pct", { precision: 6, scale: 2 })
    .notNull()
    .default("5"),
  simulationMode: boolean("simulation_mode").notNull().default(true),
  maxSlippagePct: numeric("max_slippage_pct", { precision: 6, scale: 2 })
    .notNull()
    .default("0.5"),
  targetProtocols: text("target_protocols")
    .notNull()
    .default("uniswap_v3,aave_v3,balancer"),
  openaiApiKeyMasked: text("openai_api_key_masked"),
  pimlicoApiKeyMasked: text("pimlico_api_key_masked"),
  rpcEndpointMasked: text("rpc_endpoint_masked"),
  sweepMode: text("sweep_mode").notNull().default("AUTO_SWEEP"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({
  id: true,
});
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
