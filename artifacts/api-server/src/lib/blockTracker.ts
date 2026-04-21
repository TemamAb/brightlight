/**
 * KPI 8: Multi-chain Provider Matrix.
 * Tracks block heights for 11+ chains simultaneously using mapped RPCs.
 */

import { logger } from "./logger";

const RPC_CONFIG: Record<number, string> = {
  1: process.env.ETH_RPC_URL || "https://cloudflare-eth.com",
  8453: process.env.BASE_RPC_URL || "https://mainnet.base.org",
  42161: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
  137: process.env.POLYGON_RPC_URL || "https://polygon-mainnet.infura.io/v3/default",
  10: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
  56: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org",
  43114: process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc",
  59144: process.env.LINEA_RPC_URL || "https://rpc.linea.build",
  534352: process.env.SCROLL_RPC_URL || "https://rpc.scroll.io",
  81457: process.env.BLAST_RPC_URL || "https://rpc.blast.io",
  324: process.env.ZKSYNC_RPC_URL || "https://mainnet.era.zksync.io"
};

const CHAIN_POLL_INTERVALS: Record<number, number> = {
  1: 12_000,    // Ethereum
  8453: 2_000,  // Base (High speed)
  42161: 2_000, // Arbitrum (High speed)
};

let chainBlocks: Record<number, number> = {};
let blocksScannedCount: number = 0;
let isTracking: boolean = false;
let trackInterval: ReturnType<typeof setInterval> | null = null;

export async function fetchCurrentBlock(chainId: number = 1): Promise<number> {
  const rpc = RPC_CONFIG[chainId] || RPC_CONFIG[1];

  try {
    const res = await fetch(rpc!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_blockNumber",
        params: [],
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = (await res.json()) as { result?: string };
      if (data.result) {
        const block = parseInt(data.result, 16);
        chainBlocks[chainId] = block;
        return block;
      }
    }
  } catch (err) {
    logger.debug({ chainId, err }, "Failed to fetch block height");
  }

  return chainBlocks[chainId] || 0;
}

export function startBlockTracking() {
  if (isTracking) return;
  isTracking = true;

  trackInterval = setInterval(async () => {
    const chainIds = Object.keys(RPC_CONFIG).map(Number);
    await Promise.all(chainIds.map(async (id) => {
      const prev = chainBlocks[id] || 0;
      const latest = await fetchCurrentBlock(id);
      if (latest > prev && prev > 0) {
        blocksScannedCount += (latest - prev);
      }
    }));
    logger.debug({ chains: Object.keys(chainBlocks).length, totalScanned: blocksScannedCount }, "Multi-chain heartbeat");
  }, 2_000); // Optimized for L2 block times
}

export function stopBlockTracking() {
  if (trackInterval) {
    clearInterval(trackInterval);
    trackInterval = null;
  }
  isTracking = false;
  blocksScannedCount = 0;
}

export function getBlockStats(chainId: number = 1) {
  return {
    currentBlock: chainBlocks[chainId] || 0,
    blocksScanned: blocksScannedCount,
    isTracking,
    allChainBlocks: chainBlocks
  };
}

export function resetBlockCount() {
  blocksScannedCount = 0;
}
