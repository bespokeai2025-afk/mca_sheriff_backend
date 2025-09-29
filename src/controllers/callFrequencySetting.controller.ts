import { Request, Response } from "express";
import { CallFrequencySettingService } from "../services/callFrequencySetting.service";
import { successWithData, errorWithData } from "../config/ApiResponse";

const service = new CallFrequencySettingService();

export class CallFrequencySettingController {
  // Create a new call frequency setting
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { number_count, selected_days, selected_weeks } = req.body;

      // Optional: validate that at least selected_days exists
      if (!selected_days || selected_days.length === 0) {
        res.status(400).json(
          errorWithData("selected_days is required", null, 400)
        );
        return;
      }

      const payload = { number_count, selected_days, selected_weeks };
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
   // Update existing call frequency setting by ID
  static async update(req: Request, res: Response): Promise<void> {
    try {
    //   const { id } = req.params;
    //   const { number_count, selected_days, selected_weeks } = req.body;
       const { id, number_count, selected_days, selected_weeks } = req.body;
      if (!id) {
        res.status(400).json(errorWithData("ID parameter is required", null, 400));
        return;
      }

      if (!selected_days || selected_days.length === 0) {
        res.status(400).json(errorWithData("selected_days is required", null, 400));
        return;
      }

      const payload = { number_count, selected_days, selected_weeks };
      const updated = await service.update(id, payload);

      if (!updated) {
        res.status(404).json(errorWithData("Call frequency setting not found", null, 404));
        return;
      }

      res.status(200).json(
        successWithData("Call frequency setting updated successfully", updated, undefined, 200)
      );
    } catch (err: any) {
      console.error(err);
      res.status(500).json(errorWithData("Failed to update call frequency setting", err.message, 500));
    }
  }

}
