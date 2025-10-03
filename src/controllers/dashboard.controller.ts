import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";
import { successWithData, errorWithData } from "../config/ApiResponse"; // adjust path

export class DashboardController {

  // Helper methods to standardize success responses
  private static sendSuccess<T>(res: Response, message: string, data: T, statusCode = 200) {
    res.status(statusCode).json(successWithData(message, data, undefined, statusCode));
  }
  // Helper methods to standardize error responses
  private static sendError(res: Response, message: string, error: any = null, statusCode = 500) {
    res.status(statusCode).json(errorWithData(message, error, statusCode));
  }
  // Total call minutes
  static async totalCallMinutes(req: Request, res: Response) {
    try {
      const months = Number(req.body.months) || 6;
      const data = await DashboardService.getTotalCallMinutes(months);
      DashboardController.sendSuccess(res, "Total call minutes fetched successfully", data, 200);
    } catch (error) {
      console.error(error);
      DashboardController.sendError(res, "Failed to fetch total call minutes", error, 500);
    }
  }

  // Number of calls
  static async numberOfCalls(req: Request, res: Response) {
    try {
      const months = Number(req.body.months) || 6;
      const data = await DashboardService.getNumberOfCalls(months);
      DashboardController.sendSuccess(res, "Number of calls fetched successfully", data, 200);
    } catch (error) {
      DashboardController.sendError(res, "Failed to fetch number of calls", error, 500);
    }
  }
  // Leads
  static async leads(req: Request, res: Response) {
    try {
      const months = Number(req.body.months) || 6;
      const data = await DashboardService.getLeads(months);
      DashboardController.sendSuccess(res, "Leads fetched successfully", data, 200);
    } catch (error) {
      DashboardController.sendError(res, "Failed to fetch leads", error, 500);
    }
  }

  // Call performance
  static async callPerformance(req: Request, res: Response) {
    try {
      const months = Number(req.body.months) || 6;
      const data = await DashboardService.getCallPerformance(months);
      DashboardController.sendSuccess(res, "Call performance fetched successfully", data, 200);
    } catch (error) {
      DashboardController.sendError(res, "Failed to fetch call performance", error, 500);
    }
  }
// Call Drops 
static async callDrops(req: Request, res: Response) {
  try {
    const months = Number(req.body.months) || 6; // default: last 6 months
    const data = await DashboardService.callDrops(months);
    DashboardController.sendSuccess(res, "Call drop stats fetched successfully", data, 200);
  } catch (error) {
    DashboardController.sendError(res, "Failed to fetch call drop stats", error, 500);
  }
}

}
