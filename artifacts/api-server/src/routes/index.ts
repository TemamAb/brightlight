import { Router, type IRouter } from "express";
import healthRouter from "./health";
import engineRouter from "./engine";
import tradesRouter from "./trades";
import walletRouter from "./wallet";
import telemetryRouter from "./telemetry";
import settingsRouter from "./settings";
import autodetectRouter from "./autodetect";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  res.json({
    message: "BrightSky Elite Engine Online",
    version: "1.0.0-production",
    mode: process.env.NODE_ENV || "development",
    system: "TypeScript/Node.js",
    health: "/api/health"
  });
});

router.use(healthRouter);
router.use(engineRouter);
router.use(tradesRouter);
router.use(walletRouter);
router.use(telemetryRouter);
router.use(settingsRouter);
router.use("/autodetect", autodetectRouter);

export default router;
