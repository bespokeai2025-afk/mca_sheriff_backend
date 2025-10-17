// import { Request, Response } from "express";
// import { CallFrequencySettingService } from "../services/callFrequencySetting.service";
// import { successWithData, errorWithData } from "../config/ApiResponse";
// import { isValidCron } from "cron-validator";

// const service = new CallFrequencySettingService();

// export class CallFrequencySettingController {
//   static async create(req: Request, res: Response) {
//     try {
//       const result = await service.create(req.body);
//       res.status(200).json(successWithData("Call frequency setting created successfully", result, undefined, 200));
//     } catch (err: any) {
//       res.status(500).json(errorWithData("Failed to create call frequency setting", err.message, 500));
//     }
//   }

//   static async getAll(req: Request, res: Response) {
//     try {
//       const settings = await service.getAll();
//       res.status(200).json(successWithData("Call frequency settings fetched successfully", settings, undefined, 200));
//     } catch (err: any) {
//       res.status(500).json(errorWithData("Failed to fetch call frequency settings", err.message, 500));
//     }
//   }

//   static async update(req: Request, res: Response) {
//     try {
//       const { id, call_frequency_setting, timeZone, label, isActive } = req.body;

//       if (!id) return res.status(400).json(errorWithData("ID is required", null, 400));
//       if (!call_frequency_setting) return res.status(400).json(errorWithData("call_frequency_setting is required", null, 400));

//       if (!isValidCron(call_frequency_setting, { seconds: false })) {
//         return res.status(400).json(errorWithData("Invalid cron expression", call_frequency_setting, 400));
//       }

//       const payload = { call_frequency_setting, timeZone, label, isActive };
//       const updated = await service.updateOrInsert(id, payload);

//       res.status(200).json(successWithData("Call frequency setting saved successfully", updated, undefined, 200));
//     } catch (err: any) {
//       res.status(500).json(errorWithData("Failed to save call frequency setting", err.message, 500));
//     }
//   }
// }


import { Request, Response } from "express";
import { CallFrequencySettingService } from "../services/callFrequencySetting.service";
import { successWithData, errorWithData } from "../config/ApiResponse";
import { isValidCron } from "cron-validator";
 
const service = new CallFrequencySettingService();
 
export class CallFrequencySettingController {
  static async create(req: Request, res: Response) {
    try {
      const result = await service.create(req.body);
      res.status(200).json(
        successWithData("Call frequency setting created successfully", result, undefined, 200)
      );
    } catch (err: any) {
      res.status(500).json(
        errorWithData("Failed to create call frequency setting", err.message, 500)
      );
    }
  }
 
  static async getAll(req: Request, res: Response) {
    try {
      const settings = await service.getAll();
      res.status(200).json(
        successWithData("Call frequency settings fetched successfully", settings, undefined, 200)
      );
    } catch (err: any) {
      res.status(500).json(
        errorWithData("Failed to fetch call frequency settings", err.message, 500)
      );
    }
  }
 
  static async update(req: Request, res: Response) {
    try {
      const { id, call_frequency_setting, timeZone, label, isActive, cronValue } = req.body;
 
      if (!id)
        return res.status(400).json(errorWithData("ID is required", null, 400));
      if (!call_frequency_setting)
        return res
          .status(400)
          .json(errorWithData("call_frequency_setting is required", null, 400));
 
      //  Handle AWS cron expressions directly (skip re-validation for "cron(...)")
      const isAwsCron = call_frequency_setting.trim().startsWith("cron(");
 
      if (!isAwsCron) {
        if (!isValidCron(call_frequency_setting, { seconds: false })) {
          return res
            .status(400)
            .json(errorWithData("Invalid cron expression", call_frequency_setting, 400));
        }
      }
 
      const payload = { call_frequency_setting, timeZone, label, isActive, cronValue };
      const updated = await service.updateOrInsert(id, payload);
 
      res.status(200).json(
        successWithData("Call frequency setting saved successfully", updated, undefined, 200)
      );
    } catch (err: any) {
      res.status(500).json(
        errorWithData("Failed to save call frequency setting", err.message, 500)
      );
    }
  }
}