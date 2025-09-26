import { Request, Response } from "express";
import { CenterStagedCallService } from "../services/centerStagedCall.service";
import { successWithData, errorWithData } from "../config/ApiResponse"; // adjust path

export class CenterStagedCallController {

  // Helper methods to standardize success responses
  private static sendSuccess<T>(res: Response, message: string, data: T, statusCode = 200) {
    res.status(statusCode).json(successWithData(message, data, undefined, statusCode));
  }

  // Helper methods to standardize error responses
  private static sendError(res: Response, message: string, error: any = null, statusCode = 500) {
    res.status(statusCode).json(errorWithData(message, error, statusCode));
  }

  // Total call minutes
  static async callFilterCenterStage(req: Request, res: Response) {
    try {
      const months = Number(req.body.months) || 6;
      const data = await CenterStagedCallService.callFilterCenterStage(months);
      CenterStagedCallController.sendSuccess(res, "Total call minutes fetched successfully", data, 200);
    } catch (error) {
      console.error(error);
      CenterStagedCallController.sendError(res, "Failed to fetch total call minutes", error, 500);
    }
  } 
}
