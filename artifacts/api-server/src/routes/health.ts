/**
 * Health check route.
 *
 * IMPORTANT: render.yaml sets healthCheckPath: /api/health
 * The Express app mounts all routes under /api, so this route
 * is registered as GET /health but is reachable at GET /api/health.
 *
 * Without a matching health endpoint, Render's poller gets a 404
 * and marks the service as unhealthy → continuous restart loop.
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// Primary path — must match render.yaml healthCheckPath minus the /api prefix
// (Express mounts under /api, so /health here = /api/health externally)
router.get("/health", async (_req, res) => {
  try {
    // Audit Step 1: Check if the environment variable is actually present in the process
    const hasPrimaryDbUrl = !!process.env.DATABASE_URL;
    const hasAnyDbUrl = !!(
      process.env.DATABASE_URL ||
      process.env.DATABASE_CONNECTION_STRING
    );
    const hasPimlico = !!process.env.PIMLICO_API_KEY;
    const hasPrivateKey = !!process.env.PRIVATE_KEY;
    const hasRpc = !!process.env.RPC_ENDPOINT;
    const isStrict = process.env.PRE_FLIGHT_STRICT === "true";
    
    // Diagnostics: Check for common typos in the environment
    const envKeys = Object.keys(process.env).filter(
      k => k.toLowerCase().includes('database') || k.toLowerCase().includes('db_') || k.toLowerCase().includes('postgres')
    ).sort();

    if (!hasPrimaryDbUrl || !hasPimlico || !hasPrivateKey || !hasRpc) {
      console.warn("[health] Essential configuration missing for LIVE mode:", { 
        hasPrimaryDbUrl, hasPimlico, hasPrivateKey, hasRpc, 
        strictMode: isStrict, detectedKeys: envKeys 
      });
    }

    if (!db) {
      return res.status(503).json({
        status: "error",
        db: "not_initialized",
        env_var_present: hasAnyDbUrl,
        message: hasAnyDbUrl
          ? "Database variable exists but client failed to initialize. Check @workspace/db logic."
          : "No database URL found in primary or fallback environment variables.",
        detected_env_keys: envKeys,
        preflight_strict: isStrict,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    }

    await db.execute(sql`SELECT 1`);
    res.json({
      status: "ok",
      db: "connected",
      preflight_strict: isStrict,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      db: "connection_failed",
      message: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
  }
});

// Legacy alias kept for backward compatibility
router.get("/healthz", (_req, res) => {
  // Redirect to primary health check for consistency
  res.redirect("/api/health");
});

export default router;
