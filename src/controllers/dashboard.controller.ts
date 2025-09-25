import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {

 static async totalCallMinutes(req: Request, res: Response) {
    try {
      const months = Number(req.query.months) || 6; // default 6 months
      const data = await DashboardService.getTotalCallMinutes(months);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch total call minutes", error });
    }
  }

  static async numberOfCalls(req: Request, res: Response) {
    try {
      const months = Number(req.query.months) || 6;
      const totalCalls = await DashboardService.getNumberOfCalls(months);
      res.json({ success: true, data: totalCalls });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch number of calls", error });
    }
  }

  static async leads(req: Request, res: Response) {
    try {
      const months = Number(req.query.months) || 6;
      const leads = await DashboardService.getLeads(months);
      res.json({ success: true, data: leads });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch leads", error });
    }
  }

  static async callPerformance(req: Request, res: Response) {
    try {
      const months = Number(req.query.months) || 6;
      const performance = await DashboardService.getCallPerformance(months);
      res.json({ success: true, data: performance });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch call performance", error });
    }
  }
}
