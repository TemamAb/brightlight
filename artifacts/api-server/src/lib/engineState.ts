/**
 * Shared engine state module.
 * Allows wallet.ts and other routes to read engine state
 * without circular imports.
 */

export interface SharedEngineState {
  running: boolean;
  mode: "SHADOW" | "LIVE" | "STOPPED";
  walletAddress: string | null;
  liveCapable: boolean;
  pimlicoEnabled: boolean;
  gaslessMode: boolean;
  startedAt: Date | null;
  chainLatencies: Record<number, number>; // KPI 18: Per-chain latency tracking
  pathComplexity: Record<number, number>; // KPI 13: Hop distribution (2-hop, 3-hop, etc.)
  lastBackbonePrice: number | null; // Elite Grade: High-frequency price sync
  ipcConnected: boolean; // KPI 1: Rust Worker Link Status
  flashloanContractAddress: string | null; // Dynamically received from Rust core
  shadowModeActive: boolean; // BSS-26/38: Integrity-based safety gate
  subsystemKpis: any[]; // Neural Feedback Panel data
  bottleneckReport: any; // Bottleneck analysis data
}

export const sharedEngineState: SharedEngineState = {
  running: false,
  mode: "STOPPED",
  walletAddress: null,
  liveCapable: false,
  pimlicoEnabled: false,
  gaslessMode: true,
  startedAt: null,
  chainLatencies: {},
  pathComplexity: { 2: 0, 3: 0, 4: 0, 5: 0 },
  lastBackbonePrice: null,
  ipcConnected: false,
  flashloanContractAddress: null,
  shadowModeActive: false,
  subsystemKpis: [],
  bottleneckReport: null,
};
