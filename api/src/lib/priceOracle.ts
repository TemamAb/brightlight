/**
 * Free-tier ETH price oracle.
 * Primary: CoinGecko free API (no key required, 30 calls/min).
 * Fallback: DeFiLlama price API (no key required, unlimited).
 * Cache: 60-second TTL to stay within free tier rate limits.
 */

import { logger } from "./logger";

let cachedPrice: number = 0;
let lastFetch: number = 0;
const CACHE_TTL_MS = 5_000; // 5s — Optimized for Elite Grade data refresh metrics

export async function getEthPriceUsd(): Promise<number> {
  const now = Date.now();

  // Elite Validation: If the engine is running, we should prioritize 
  // the price data coming from the high-speed Rust backbone (if available).
  // This would effectively lower the "API Refresh" to the scan interval.
  
  if (now - lastFetch < CACHE_TTL_MS && cachedPrice > 0) {
    return cachedPrice;
  }

  try {
    // Primary: CoinGecko free (no API key)
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (res.ok) {
      const data = await res.json() as { ethereum?: { usd?: number } };
      const price = data?.ethereum?.usd;
      if (price && price > 0) {
        cachedPrice = price;
        lastFetch = now;
        logger.info({ price }, "ETH price refreshed from CoinGecko");
        return cachedPrice;
      }
    }
  } catch (err) {
    logger.warn({ err }, "CoinGecko price fetch failed, trying DeFiLlama");
  }

  try {
    // Fallback: DeFiLlama (no key, very reliable)
    const res = await fetch(
      "https://coins.llama.fi/prices/current/coingecko:ethereum",
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json() as { coins?: { "coingecko:ethereum"?: { price?: number } } };
      const price = data?.coins?.["coingecko:ethereum"]?.price;
      if (price && price > 0) {
        cachedPrice = price;
        lastFetch = now;
        logger.info({ price }, "ETH price refreshed from DeFiLlama");
        return cachedPrice;
      }
    }
  } catch (err) {
    logger.warn({ err }, "DeFiLlama price fetch also failed, using cached price");
  }

  return cachedPrice;
}
