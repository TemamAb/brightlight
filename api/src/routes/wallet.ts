/**
 * Wallet route — uses real wallet address from engine state.
 * ETH balance fetched from Cloudflare public RPC when engine is running.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { getEthPriceUsd } from "../lib/priceOracle";
import { sharedEngineState } from "../lib/engineState";

const router = Router();

async function fetchEthBalance(address: string): Promise<number> {
  if (!address) return 0;
  try {
    const res = await fetch("https://cloudflare-eth.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_getBalance",
        params: [address, "latest"]
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json() as { result?: string };
      if (data.result) {
        // Convert from wei (hex) to ETH
        const weiHex = BigInt(data.result);
        return Number(weiHex) / 1e18;
      }
    }
  } catch (_) {}
  return 0;
}

router.get("/wallet", async (req, res) => {
  const rows = await db.select().from(settingsTable).limit(1);
  const settings = rows[0];

  const address = sharedEngineState.walletAddress;
  const ethPrice = await getEthPriceUsd();

  // Fetch real balance if we have a real address and engine is running
  const balanceEth = address && sharedEngineState.running
    ? await fetchEthBalance(address)
    : 0;

  const balanceUsd = balanceEth * ethPrice;

  res.json({
    address,
    balanceEth,
    balanceUsd,
    ethPriceUsd: ethPrice,
    sweepMode: settings?.sweepMode ?? "AUTO_SWEEP",
    pimlicoApiKey: settings?.pimlicoApiKeyMasked ? "pm-****" + settings.pimlicoApiKeyMasked : null,
    rpcEndpoint: settings?.rpcEndpointMasked ? "https://****" + settings.rpcEndpointMasked : null,
    gaslessEnabled: true,
    liveCapable: sharedEngineState.liveCapable,
    // Honest disclosure
    note: sharedEngineState.liveCapable
      ? "Live execution enabled via Pimlico."
      : "Wallet is ephemeral (session-only). Add Pimlico API key + private RPC in Settings to enable real gasless execution.",
  });
});

router.put("/wallet/config", async (req, res) => {
  const { rpcEndpoint, pimlicoApiKey, sweepMode } = req.body;
  const rows = await db.select().from(settingsTable).limit(1);

  const updates: Record<string, unknown> = {};
  if (rpcEndpoint !== undefined) updates.rpcEndpointMasked = rpcEndpoint.slice(-8);
  if (pimlicoApiKey !== undefined) updates.pimlicoApiKeyMasked = pimlicoApiKey.slice(-8);
  if (sweepMode !== undefined) updates.sweepMode = sweepMode;

  if (rows.length === 0) {
    await db.insert(settingsTable).values({ ...updates });
  } else {
    if (Object.keys(updates).length > 0) {
      await db.update(settingsTable).set(updates);
    }
  }

  res.json({ success: true, message: "Wallet config updated." });
});

export default router;
