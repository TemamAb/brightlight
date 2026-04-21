import type { TradingAnalysis, MarketData } from "./lib/ai-agent";

/**
 * BrightSky Bribe Engine with AI-Powered Analysis
 * Ported from the Rational Predator logic in the Python debug assets.
 */
export class BrightSkyBribeEngine {
  // BSS-07: Bribe Engine / BSS-20: Self-Heal Loop
  // Config is mutable to allow BSS-20 (Feedback Engine) to optimize parameters 
  // based on block-inclusion success rates and competitive gas auctions.
  private static CONFIG = {
    BRIBE_RATIO: 0.05, // 5% bribe for builder prioritization
    MIN_MARGIN_RATIO: 0.15, // 15% minimum net margin gate
  };

  /**
   * BSS-20 Integration: Allows the autonomous feedback loop to tweak
   * performance parameters 24/7 based on real-world success rates.
   */
  static updateTuning(newParams: Partial<typeof BrightSkyBribeEngine.CONFIG>) {
    this.CONFIG = { ...this.CONFIG, ...newParams };
    console.log("[LEARNING_LOOP] Parameters optimized:", this.CONFIG);
  }

  static getTuning() {
    return { ...this.CONFIG };
  }

  /**
   * BSS-09: EV Risk Engine
   * Calculates Expected Value: (Profit * Success%) - (RevertCost * Fail%)
   */
  static calculateExpectedValue(
    grossProfit: number,
    successProbability: number,
    estimatedGasCost: number,
    networkLatencyMs: number = 0
  ) {
    // AlphaMax Latency Penalty: Decay success probability as latency increases
    // Every 10ms of extra latency reduces success chance by 5%
    const latencyDecay = Math.max(0, (networkLatencyMs - 20) / 10) * 0.05;
    const adjustedSuccessProb = Math.max(0, successProbability - latencyDecay);

    const failProbability = 1 - adjustedSuccessProb;
    // Revert cost is usually lower than execution cost but still significant
    const revertCost = estimatedGasCost * 0.4; 
    
    const expectedProfit = grossProfit * adjustedSuccessProb;
    const expectedLoss = revertCost * failProbability;
    
    return expectedProfit - expectedLoss;
  }

  /**
   * Calculates the bribe amount and probabilistic net margin.
   *
   * @param profit The gross profit in USD or target asset
   * @param successProb Estimated probability of bundle inclusion (0.0 to 1.0)
   * @param gasCost The estimated gas cost of the transaction
   * @returns An object containing the bribe, net margin percentage, and execution clearance
   */
  static calculateProtectedBribe(
    profit: number, 
    successProb: number = 0.95, 
    gasCost: number = 0
  ) {
    if (profit <= 0) {
      return { bribe: 0, margin: 0, proceed: false, netProfit: 0, ev: 0 };
    }

    // AlphaMax Injection: Adversarial Risk Adjustment
    // If success probability is below 50%, we treat the trade as "Combative"
    // and increase the bribe ratio to secure inclusion.
    let dynamicBribeRatio = this.CONFIG.BRIBE_RATIO;
    if (successProb < 0.6) {
      // BSS-17: Adversarial bidding escalation
      dynamicBribeRatio *= 1.5; 
      console.log("[BSS-17] Competitive threat detected. Escalating bribe ratio.");
    }

    // 1. Apply BSS-09: EV Risk Engine Filter
    const ev = this.calculateExpectedValue(profit, successProb, gasCost);
    
    // 2. Compute Bribe based on EV
    const bribe = ev * dynamicBribeRatio;
    const netProfit = Math.max(0, ev - bribe);

    // 3. AlphaMax Standard: Strict EV Rejection
    // If EV is less than 2x the gas cost, the risk of a revert makes the trade non-viable
    // regardless of the nominal spread.
    const riskPremiumGate = ev > (gasCost * 2);
    
    const margin = ((netProfit + 1e-9) / profit) * 100;
    const proceed = margin >= (this.CONFIG.MIN_MARGIN_RATIO * 100) - 0.001 && ev > 0 && riskPremiumGate;

    return {
      bribe,
      margin: parseFloat(margin.toFixed(2)),
      proceed,
      netProfit,
      ev
    };
  }

  /**
   * AI-powered analysis for arbitrage opportunities
   * @param marketData Current market conditions
   * @param profit Potential profit amount
   * @returns AI analysis combined with traditional bribe calculation
   */
  static async analyzeArbitrageOpportunity(
    marketData: MarketData,
    profit: number
  ): Promise<{
    bribeAnalysis: ReturnType<typeof this.calculateProtectedBribe>;
    aiAnalysis: TradingAnalysis; // BSS-21: Alpha-Copilot
    finalRecommendation: 'EXECUTE' | 'SKIP' | 'MONITOR';
  }> {
    // BSS-16/BSS-18 Integration: Derive success probability from congestion and latency
    const networkLatency = marketData.latencyMs || 25; 
    const congestionFactor = marketData.volatility > 0.5 ? 0.2 : 0.05;
    const successProb = Math.max(0.1, 0.98 - congestionFactor);

    const bribeAnalysis = this.calculateProtectedBribe(profit, successProb, 0.005);

    const { tradingAI } = await import("./lib/ai-agent");

    // Get AI analysis of market conditions
    const aiAnalysis = await tradingAI.analyzeMarket(marketData);

    // Combine AI insights with traditional analysis
    let finalRecommendation: 'EXECUTE' | 'SKIP' | 'MONITOR' = 'SKIP';

    if (bribeAnalysis.proceed && aiAnalysis.recommendation === 'BUY' && aiAnalysis.confidence > 70) {
      finalRecommendation = 'EXECUTE';
    } else if (bribeAnalysis.margin > 10 && aiAnalysis.riskLevel === 'LOW') {
      finalRecommendation = 'MONITOR';
    }

    return {
      bribeAnalysis,
      aiAnalysis,
      finalRecommendation
    };
  }
}
