import type { Opportunity } from "./opportunityScanner";
import { logger } from "./logger";

export interface DynamicGasStrategyInput {
  baseGasUnits: number;
  spreadPct: number;
  maxBribePct: number;
}

export interface DynamicGasStrategyResult {
  adjustedGasUnits: number;
  urgencyBps: number;
}

export interface SimulationInput {
  opportunity: Opportunity;
  maxSlippagePct: number;
  minMarginPct: number;
  minNetProfitEth: number;
  adjustedGasUnits: number;
}

export interface SimulationResult {
  ok: boolean;
  reason: string | null;
  simulatedSlippagePct: number;
  estimatedNetProfitEth: number;
  estimatedMarginPct: number;
  adjustedGasUnits: number;
}

export interface CircuitBreakerState {
  consecutiveFailures: number;
  openedAt: number | null;
  blockedUntil: number | null;
  lastFailureReason: string | null;
  totalTrips: number;
}

export interface ExecutionGateResult {
  allowed: boolean;
  reason: string | null;
  retryAfterMs: number;
}

const DEFAULT_COOLDOWN_MS = 3 * 60_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * KPI 20: On-chain Revert Prediction.
 * Dry-runs the arbitrage call against the target RPC to ensure <1% revert rate.
 */
export async function simulateOnChain(
  rpcUrl: string,
  target: string,
  data: string,
  from: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          {
            from,
            to: target,
            data
          },
          "latest"
        ]
      }),
      signal: AbortSignal.timeout(3000)
    });
    const json = await res.json() as { error?: { message: string } };
    if (json.error) return { success: false, error: json.error.message };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: "Simulation timed out or RPC unreachable" };
  }
}

export function computeDynamicGasStrategy(
  input: DynamicGasStrategyInput,
): DynamicGasStrategyResult {
  const spreadFactor = clamp(input.spreadPct / 2, 0, 1);
  const urgencyBps = Math.round(clamp(25 + spreadFactor * 75 + input.maxBribePct * 5, 25, 150));
  const adjustedGasUnits = Math.max(
    input.baseGasUnits,
    Math.round(input.baseGasUnits * (1 + urgencyBps / 1000)),
  );

  return { adjustedGasUnits, urgencyBps };
}

export function simulateOpportunityExecution(
  input: SimulationInput,
): SimulationResult {
  const notional = Math.max(input.opportunity.flashLoanSizeEth, 0.0001);
  const protocolPenaltyPct = input.opportunity.protocol.includes("curve")
    ? 0.04  // Optimized from 0.08 to reflect Curve's low-slippage stable swaps
    : input.opportunity.protocol.includes("balancer")
      ? 0.05
      : 0.03;
  const sizePenaltyPct = clamp(notional / 400, 0.01, 0.25);
  const gasPenaltyPct =
    ((input.adjustedGasUnits - input.opportunity.gasEstimate) /
      Math.max(input.opportunity.gasEstimate, 1)) *
    0.3;
  const simulatedSlippagePct = Number(
    (protocolPenaltyPct + sizePenaltyPct + Math.max(gasPenaltyPct, 0)).toFixed(4),
  );

  const slippageLossEth = notional * (simulatedSlippagePct / 100);
  const estimatedNetProfitEth = Number(
    (input.opportunity.estProfitEth - slippageLossEth).toFixed(6),
  );
  const estimatedMarginPct = Number(
    ((estimatedNetProfitEth / notional) * 100).toFixed(4),
  );

  if (simulatedSlippagePct > input.maxSlippagePct) {
    return {
      ok: false,
      reason: `simulated slippage ${simulatedSlippagePct}% exceeds cap ${input.maxSlippagePct}%`,
      simulatedSlippagePct,
      estimatedNetProfitEth,
      estimatedMarginPct,
      adjustedGasUnits: input.adjustedGasUnits,
    };
  }

  if (estimatedNetProfitEth <= input.minNetProfitEth) {
    return {
      ok: false,
      reason: `simulated net profit ${estimatedNetProfitEth} ETH below floor ${input.minNetProfitEth} ETH`,
      simulatedSlippagePct,
      estimatedNetProfitEth,
      estimatedMarginPct,
      adjustedGasUnits: input.adjustedGasUnits,
    };
  }

  if (estimatedMarginPct < input.minMarginPct) {
    return {
      ok: false,
      reason: `simulated margin ${estimatedMarginPct}% below gate ${input.minMarginPct}%`,
      simulatedSlippagePct,
      estimatedNetProfitEth,
      estimatedMarginPct,
      adjustedGasUnits: input.adjustedGasUnits,
    };
  }

  return {
    ok: true,
    reason: null,
    simulatedSlippagePct,
    estimatedNetProfitEth,
    estimatedMarginPct,
    adjustedGasUnits: input.adjustedGasUnits,
  };
}

export function createCircuitBreakerState(): CircuitBreakerState {
  return {
    consecutiveFailures: 0,
    openedAt: null,
    blockedUntil: null,
    lastFailureReason: null,
    totalTrips: 0,
  };
}

export function checkExecutionGate(
  state: CircuitBreakerState,
  now = Date.now(),
): ExecutionGateResult {
  if (!state.blockedUntil || state.blockedUntil <= now) {
    return { allowed: true, reason: null, retryAfterMs: 0 };
  }

  return {
    allowed: false,
    reason: state.lastFailureReason ?? "circuit breaker active",
    retryAfterMs: state.blockedUntil - now,
  };
}

export function registerExecutionSuccess(state: CircuitBreakerState): CircuitBreakerState {
  return {
    ...state,
    consecutiveFailures: 0,
    openedAt: null,
    blockedUntil: null,
    lastFailureReason: null,
  };
}

export function registerExecutionFailure(
  state: CircuitBreakerState,
  reason: string,
  now = Date.now(),
  threshold = 3,
  cooldownMs = DEFAULT_COOLDOWN_MS,
): CircuitBreakerState {
  const consecutiveFailures = state.consecutiveFailures + 1;
  const shouldTrip = consecutiveFailures >= threshold;

  return {
    consecutiveFailures,
    openedAt: shouldTrip ? now : state.openedAt,
    blockedUntil: shouldTrip ? now + cooldownMs : state.blockedUntil,
    lastFailureReason: reason,
    totalTrips: shouldTrip ? state.totalTrips + 1 : state.totalTrips,
  };
}
