import OpenAI from "openai";
import { db } from "@workspace/db";
import { tradesTable, streamEventsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { logger } from "./logger";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * KPI 21: Alpha-Copilot — AI-Powered Mission Controller.
 * Analyzes real-time performance and interacts with the Human Commander.
 */
export class AlphaCopilot {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async analyzePerformance(): Promise<string> {
    if (!this.openai) return "Copilot inactive: OPENAI_API_KEY missing.";

    try {
      // Fetch last 5 trades and 10 critical events
      const lastTrades = await db.select().from(tradesTable).orderBy(desc(tradesTable.createdAt)).limit(5);
      const recentEvents = await db.select().from(streamEventsTable).orderBy(desc(streamEventsTable.timestamp)).limit(10);

      const systemPrompt = `You are the BrightSky Alpha-Copilot, a world-class MEV strategy optimizer. 
      You have mission-critical access to the system terminal and environment variables.
      Your mandate: Analyze performance, identify anomalies, and autonomously execute terminal commands or 
      edit .env configurations (KPI 19/21) to ensure 24/7 profitability.
      Report in a professional, metallic trading tone. 
      Design aesthetic: Metallic White (#F5F7FA), Bright Blue (#00A3FF), Neon Green (#00FF94).`;

      const userMessage = JSON.stringify({
        trades: lastTrades.map(t => ({ pnl: t.profitUsd, latency: t.latencyMs, status: t.status })),
        events: recentEvents.map(e => ({ type: e.type, msg: e.message }))
      });

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content || "Analysis inconclusive.";
    } catch (err) {
      logger.error({ err }, "Alpha-Copilot analysis failed");
      return "Mission analysis error. Check system logs.";
    }
  }

  /**
   * KPI 21: Terminal Command Execution
   * Allows the Copilot to perform system maintenance and redeployment commands.
   */
  async executeMissionCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    logger.info({ command }, "Alpha-Copilot executing terminal command");
    try {
      // Restriction: Only allow pnpm and cargo related commands for safety
      if (!command.startsWith("pnpm") && !command.startsWith("cargo") && !command.includes("kill-port")) {
        throw new Error("Unauthorized command path.");
      }
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr };
    } catch (err) {
      logger.error({ err, command }, "Alpha-Copilot terminal command failed");
      return { stdout: "", stderr: String(err) };
    }
  }
}

export const alphaCopilot = new AlphaCopilot();