import express from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/today-stats", verifyAccessToken, DashboardController.todayStats);
router.post("/total-call-minutes", verifyAccessToken, DashboardController.totalCallMinutes);
router.post("/number-of-calls", verifyAccessToken, DashboardController.numberOfCalls);
router.post("/leads", verifyAccessToken, DashboardController.leads);
router.post("/call-performance", verifyAccessToken, DashboardController.callPerformance);
router.post("/call-drops", verifyAccessToken, DashboardController.callDrops);

export default router;
