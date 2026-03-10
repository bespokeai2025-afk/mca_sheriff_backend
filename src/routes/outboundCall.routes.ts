import { Router } from "express";
import {
  startBatchCalling,
  getOutboundCallsWithStats,
  outboundCallWebhook,
  saveOutboundCallFromN8n,
} from "../controllers/outboundCall.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = Router();

// GET  /outbound-call/start-calling — "Start Calling" button (requires auth)
router.get("/start-calling",  startBatchCalling);

// GET  /outbound-call/list         — stats + call table (requires auth)
// Query: ?page=1&pageSize=10
router.get("/list", verifyAccessToken, getOutboundCallsWithStats);

// POST /outbound-call/save         — n8n posts Retell payload here (no auth)
router.post("/save", saveOutboundCallFromN8n);

// POST /outbound-call/webhook      — Retell AI result callback (no auth)
router.post("/webhook", outboundCallWebhook);

export default router;
