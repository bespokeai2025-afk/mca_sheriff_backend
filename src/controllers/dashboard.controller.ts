// controllers/dashboard.controller.ts
import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {
  static async getDashboardData(req: Request, res: Response) {
    try {
      const totalMinutes = await DashboardService.getTotalCallMinutes();
      const numberOfCalls = await DashboardService.getNumberOfCalls();
      const leads = await DashboardService.getLeadsCount();
      const callPerformance = await DashboardService.getCallPerformance();

      return res.json({
        success: true,
        data: {
          totalMinutes,
          numberOfCalls,
          leads,
          callPerformance,
        },
      });
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard data",
        error: error.message,
      });
    }
  }
}
