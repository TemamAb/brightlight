/**
 * Settings Hub — Environment Orchestration & Redeploy Logic.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { alphaCopilot } from "../lib/alphaCopilot";
import { join } from "path";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /settings — Returns the full Environment Data (Masked)
 * Merges Cloud Environment with Local manual overrides.
 */
router.get("/settings", async (req, res) => {
  const envData = Object.entries(process.env).map(([key, value]) => ({
    key,
    value: key.includes("KEY") || key.includes("SECRET") || key.includes("PRIVATE") 
      ? `****${value?.slice(-4)}` 
      : value
  }));
  res.json({ success: true, env: envData });
});

/**
 * PUT /settings — Key-Value Environment Editor
 * Updates the process environment and writes to .env-data.md for persistence.
 */
router.put("/settings", async (req, res) => {
  const { env } = req.body; // Array of { key: string, value: string }
  
  try {
    for (const { key, value } of env) {
      if (key && value) {
        process.env[key] = value;
        
        // Persist to database for durability across restarts
        await db.insert(settingsTable)
          .values({ key, value, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: (settingsTable as any).key,
            set: { value, updatedAt: new Date() }
          });
      }
    }

    res.json({ success: true, message: "Environment updated. Ready for redeploy." });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * POST /settings/redeploy — System Reboot Trigger
 * Invokes the Alpha-Copilot's terminal access to restart the worker and re-detect env.
 */
router.post("/settings/redeploy", async (req, res) => {
  try {
    // Trigger terminal command for a clean reboot of the backbone
    // Optimized for Docker: Use the compiled binary in /app/bin/
    const command = "pkill -f rust-backbone || true && /app/bin/rust-backbone";
    const result = await alphaCopilot.executeMissionCommand(command);
    
    res.json({ 
      success: true, 
      message: "Redeploy command dispatched to backbone.",
      output: result 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
