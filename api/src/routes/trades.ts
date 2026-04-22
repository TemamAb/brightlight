import { Router } from "express";
import { db } from "@workspace/db";
import { tradesTable, streamEventsTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { getEthPriceUsd } from "../lib/priceOracle";

const router = Router();

router.get("/trades", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const status = req.query.status as string | undefined;

  let query = db.select().from(tradesTable).orderBy(desc(tradesTable.timestamp)).limit(limit);

  const trades = status
    ? await db.select().from(tradesTable).where(eq(tradesTable.status, status)).orderBy(desc(tradesTable.timestamp)).limit(limit)
    : await db.select().from(tradesTable).orderBy(desc(tradesTable.timestamp)).limit(limit);

  const total = await db.select({ count: sql<number>`count(*)` }).from(tradesTable);

  res.json({ trades, total: Number(total[0].count) });
});

router.get("/trades/summary", async (req, res) => {
  const allTrades = await db.select().from(tradesTable);
  const executed = allTrades.filter((t: any) => t.status === "EXECUTED");

  // Use real-time ETH price — NOT the hardcoded $3200
  const ethPrice = await getEthPriceUsd();

  const totalProfitEth = executed.reduce((sum: number, t: any) => sum + parseFloat(t.profit || "0"), 0);
  const totalProfitUsd = totalProfitEth * ethPrice;
  const successRate = allTrades.length > 0 ? (executed.length / allTrades.length) * 100 : 0;
  const avgProfitPerTrade = executed.length > 0 ? totalProfitEth / executed.length : 0;
  const totalBribesPaid = executed.reduce((sum: number, t: any) => sum + parseFloat(t.bribePaid || "0"), 0);

  const sessionCutoff = new Date(Date.now() - 3600 * 1000);
  const sessionTrades = executed.filter((t: any) => t.timestamp && new Date(t.timestamp) >= sessionCutoff);
  const sessionProfitEth = sessionTrades.reduce((sum: number, t: any) => sum + parseFloat(t.profit || "0"), 0);
  const sessionProfitUsd = sessionProfitEth * ethPrice;
  const tradesPerHour = sessionTrades.length;

  const protocolCounts: Record<string, number> = {};
  executed.forEach((t: any) => { if (t.protocol) protocolCounts[t.protocol] = (protocolCounts[t.protocol] || 0) + 1; });
  const topProtocol = Object.entries(protocolCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  res.json({
    totalProfitEth,
    totalProfitUsd,
    totalTrades: allTrades.length,
    successRate,
    avgProfitPerTrade,
    sessionProfitEth,
    sessionProfitUsd,
    tradesPerHour,
    topProtocol,
    totalBribesPaid,
  });
});

router.get("/trades/stream", async (req, res) => {
  const events = await db.select().from(streamEventsTable).orderBy(desc(streamEventsTable.timestamp)).limit(100);
  res.json({ events: events.reverse() });
});

export default router;
