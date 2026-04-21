import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, // Server-side only
});

export interface TradingAnalysis {
  recommendation: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reasoning: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  change24h: number;
  marketCap?: number;
}

/**
 * AI Agent for trading analysis using OpenAI
 */
export class TradingAIAgent {
  private model = "gpt-4-turbo-preview";

  /**
   * Analyze market data and provide trading recommendations
   */
  async analyzeMarket(data: MarketData): Promise<TradingAnalysis> {
    const prompt = `
You are an expert cryptocurrency trading analyst. Analyze the following market data and provide a trading recommendation.

Market Data:
- Symbol: ${data.symbol}
- Current Price: $${data.price}
- 24h Change: ${data.change24h}%
- Volume: ${data.volume}
- Market Cap: ${data.marketCap ? `$${data.marketCap}` : "N/A"}

Provide your analysis in the following JSON format:
{
  "recommendation": "BUY" | "SELL" | "HOLD",
  "confidence": number (0-100),
  "reasoning": "detailed explanation",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}

Consider:
- Price momentum and trends
- Volume analysis
- Market sentiment
- Risk factors
- Technical indicators (if applicable)
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a professional cryptocurrency trading analyst. Provide objective, data-driven recommendations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");

      return {
        recommendation: result.recommendation || "HOLD",
        confidence: Math.min(100, Math.max(0, result.confidence || 50)),
        reasoning: result.reasoning || "Analysis incomplete",
        riskLevel: result.riskLevel || "MEDIUM",
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        recommendation: "HOLD",
        confidence: 0,
        reasoning: "Analysis failed due to API error",
        riskLevel: "HIGH",
      };
    }
  }

  /**
   * Generate trading strategy suggestions
   */
  async generateStrategy(marketConditions: string): Promise<string> {
    const prompt = `
Based on the current market conditions: "${marketConditions}"

Generate a comprehensive trading strategy that includes:
1. Overall market outlook
2. Recommended asset allocation
3. Risk management rules
4. Entry/exit criteria
5. Position sizing guidelines

Provide practical, actionable advice for institutional trading.
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a senior portfolio manager providing institutional-grade trading strategies.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      });

      return (
        response.choices[0]?.message?.content || "Strategy generation failed"
      );
    } catch (error) {
      console.error("Strategy generation error:", error);
      return "Unable to generate strategy due to API error";
    }
  }

  /**
   * Analyze portfolio performance and provide insights
   */
  async analyzePortfolio(
    holdings: Array<{
      symbol: string;
      amount: number;
      avgPrice: number;
      currentPrice: number;
    }>,
  ): Promise<string> {
    const portfolioSummary = holdings
      .map(
        (h) =>
          `${h.symbol}: ${h.amount} units @ avg $${h.avgPrice}, current $${h.currentPrice}`,
      )
      .join("\n");

    const prompt = `
Analyze this portfolio performance:

${portfolioSummary}

Provide insights on:
1. Overall portfolio health
2. Best/worst performers
3. Rebalancing recommendations
4. Risk assessment
5. Future outlook
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a portfolio analyst providing detailed performance analysis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 800,
      });

      return (
        response.choices[0]?.message?.content || "Portfolio analysis failed"
      );
    } catch (error) {
      console.error("Portfolio analysis error:", error);
      return "Unable to analyze portfolio due to API error";
    }
  }
}

// Export singleton instance
export const tradingAI = new TradingAIAgent();
