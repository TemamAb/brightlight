import { db } from "@workspace/db";
import { tradesTable, streamEventsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { logger } from "./logger";
import { exec } from "child_process";
import { promisify } from "util";
import { sharedEngineState } from "./engineState";

const execAsync = promisify(exec);

/**
 * KPI 21: Alpha-Copilot — AI-Powered Mission Controller.
 * Analyzes real-time performance and interacts with the Human Commander.
 */
export class AlphaCopilot {
  constructor() {}

  async analyzePerformance(): Promise<string> {
    try {
      // Fetch last 5 trades and 10 critical events
      const lastTrades = await db.select().from(tradesTable).orderBy(desc(tradesTable.timestamp)).limit(5);
      const recentEvents = await db.select().from(streamEventsTable).orderBy(desc(streamEventsTable.timestamp)).limit(10);

      const totalPnL = lastTrades.reduce((acc, t) => acc + Number(t.profitUsd || 0), 0);
      
      const report = [
        "─── BRIGHTSKY MISSION REPORT ───",
        `MODE: ${sharedEngineState.mode}`,
        `INTEGRITY: ${sharedEngineState.shadowModeActive ? "DEGRADED (SHADOW)" : "OPTIMAL"}`,
        `IPC_STATUS: ${sharedEngineState.ipcConnected ? "CONNECTED" : "DISCONNECTED"}`,
        "",
        "─── PERFORMANCE ───",
        `RECENT_PNL: $${totalPnL.toFixed(2)}`,
        `LAST_TRADES:`,
        ...lastTrades.map(t => `  • [${t.status}] $${t.profitUsd} (${t.latencyMs}ms)`),
        "",
        "─── SYSTEM EVENTS ───",
        ...recentEvents.map(e => {
          const msg = e.message.length > 50 ? e.message.substring(0, 47) + "..." : e.message;
          return `  ! [${e.type}] ${msg}`;
        }),
        "───────────────────────────────"
      ].join("\n");

      return report;
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