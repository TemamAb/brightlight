import test from "node:test";
import assert from "node:assert/strict";
import {
  checkExecutionGate,
  computeDynamicGasStrategy,
  createCircuitBreakerState,
  registerExecutionFailure,
  registerExecutionSuccess,
  simulateOpportunityExecution,
} from "./executionControls.ts";
import type { Opportunity } from "./opportunityScanner.ts";

function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    protocol: "uniswap_v3_base",
    tokenIn: "WETH",
    tokenOut: "USDC",
    estProfitEth: 0.32,
    spreadPct: 0.9,
    flashLoanSizeEth: 100,
    meetsMarginGate: true,
    blockNumber: 1,
    detectedAt: new Date("2026-01-01T00:00:00Z"),
    realData: true,
    dataSource: "test",
    gasEstimate: 200_000,
    ...overrides,
  };
}

test("computeDynamicGasStrategy raises gas units for higher urgency", () => {
  const result = computeDynamicGasStrategy({
    baseGasUnits: 200_000,
    spreadPct: 1.2,
    maxBribePct: 5,
  });

  assert.equal(result.adjustedGasUnits > 200_000, true);
  assert.equal(result.urgencyBps >= 25, true);
});

test("simulateOpportunityExecution rejects opportunities above slippage cap", () => {
  const opportunity = makeOpportunity({
    protocol: "curve",
    flashLoanSizeEth: 100,
    estProfitEth: 0.12,
  });

  const result = simulateOpportunityExecution({
    opportunity,
    maxSlippagePct: 0.2,
    minMarginPct: 0.05,
    minNetProfitEth: 0.01,
    adjustedGasUnits: 240_000,
  });

  assert.equal(result.ok, false);
  assert.match(result.reason ?? "", /slippage/i);
});

test("simulateOpportunityExecution accepts profitable low-slippage opportunities", () => {
  const opportunity = makeOpportunity({
    flashLoanSizeEth: 10,
    estProfitEth: 0.25,
  });

  const result = simulateOpportunityExecution({
    opportunity,
    maxSlippagePct: 0.5,
    minMarginPct: 1,
    minNetProfitEth: 0.01,
    adjustedGasUnits: 205_000,
  });

  assert.equal(result.ok, true);
  assert.equal(result.estimatedNetProfitEth > 0.01, true);
});

test("circuit breaker trips after three failures and resets on success", () => {
  const now = Date.UTC(2026, 0, 1, 0, 0, 0);
  let state = createCircuitBreakerState();

  state = registerExecutionFailure(state, "first", now, 3, 60_000);
  state = registerExecutionFailure(state, "second", now + 1_000, 3, 60_000);
  assert.equal(checkExecutionGate(state, now + 2_000).allowed, true);

  state = registerExecutionFailure(state, "third", now + 2_000, 3, 60_000);
  const blocked = checkExecutionGate(state, now + 2_500);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs > 0, true);

  state = registerExecutionSuccess(state);
  assert.equal(checkExecutionGate(state, now + 3_000).allowed, true);
});
