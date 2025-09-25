import express from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = express.Router();

// Total Call Minutes
router.get("/total-call-minutes", verifyAccessToken, DashboardController.totalCallMinutes);

// Number of Calls
router.get("/number-of-calls", verifyAccessToken, DashboardController.numberOfCalls);

// Leads (positive sentiment)
router.get("/leads", verifyAccessToken, DashboardController.leads);

// Call Performance (positive, neutral, negative)
router.get("/call-performance", verifyAccessToken, DashboardController.callPerformance);

export default router;
