import { Request, Response } from "express";
import { CallFrequencySettingService } from "../services/callFrequencySetting.service";
import { successWithData, errorWithData } from "../config/ApiResponse";

const service = new CallFrequencySettingService();

export class CallFrequencySettingController {
  // Create a new call frequency setting
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { number_count, selected_days, selected_weeks, call_frequency_setting } = req.body;

      if (!call_frequency_setting) {
        res.status(400).json(
          errorWithData("call_frequency_setting (cronExp) is required", null, 400)
        );
        return;
      }

      // Prepare payload only with valid fields
      const payload: any = { call_frequency_setting };
      if (number_count !== undefined) payload.number_count = number_count;
      if (selected_days !== undefined) payload.selected_days = selected_days;
      if (selected_weeks !== undefined) payload.selected_weeks = selected_weeks;

      // Call service to save in database
      const result = await service.create(payload);

      res.status(200).json(
        successWithData("Call frequency setting created successfully", result, undefined, 200)
      );
    } catch (err: any) {
      console.error(err);
      res.status(500).json(
        errorWithData("Failed to create call frequency setting", err.message, 500)
      );
    }
  }

  // Get all call frequency settings
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const settings = await service.getAll();
      res.status(200).json(
        successWithData("Call frequency settings fetched successfully", settings, undefined, 200)
      );
    } catch (err: any) {
      console.error(err);
      res.status(500).json(
        errorWithData("Failed to fetch call frequency settings", err.message, 500)
      );
    }
  }
}
