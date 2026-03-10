// src/routes/lead.routes.ts

import { Router } from "express";
import { LeadController } from "../controllers/lead.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { webhookLogger } from "../logger/logger";

const router = Router();
const leadController = new LeadController();

// ── Gravity Forms Webhook receiver (no auth) ─────────────────────────────────
// Set this URL in Gravity Forms → Form Settings → Webhooks → Request URL
router.post("/webhook", (req, res) =>
  leadController.createLead(req, res)
);

// ── Webhook debug endpoint (no auth) ─────────────────────────────────────────
router.post("/webhook-test", (req, res) => {
  webhookLogger.info("[POST /lead/webhook-test] Raw webhook payload", {
    headers: {
      "content-type": req.headers["content-type"],
      origin: req.headers["origin"],
      "user-agent": req.headers["user-agent"],
    },
    body: req.body,
    bodyKeys: Object.keys(req.body || {}),
  });

  console.log("[WEBHOOK-TEST] Body:", JSON.stringify(req.body, null, 2));

  return res.status(200).json({
    success: true,
    message: "Webhook received — check server logs",
    receivedBody: req.body,
    receivedKeys: Object.keys(req.body || {}),
  });
});

// Create lead from website form
router.post("/create", (req, res) =>
  leadController.createLead(req, res)
);

// Get all leads (admin use)
router.get("/", (req, res) =>
  leadController.getLeads(req, res)
);

// GET /lead/dashboard-list?page=1&pageSize=10
// Paginated leads with stats + documents for Users tab
router.get("/dashboard-list", verifyAccessToken, (req, res) =>
  leadController.getLeadsDashboard(req, res)
);

// GET /lead/:id — full lead detail (all fields + documents + calls)
router.get("/:id", verifyAccessToken, (req, res) =>
  leadController.getLeadById(req, res)
);

export default router;