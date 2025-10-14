import { Request, Response } from "express";
import { CallFrequencySettingService } from "../services/callFrequencySetting.service";
import { successWithData, errorWithData } from "../config/ApiResponse";
import AWS from "aws-sdk";

const service = new CallFrequencySettingService();

export class CallFrequencySettingController {
  // Create a new call frequency setting
    static async create(req: Request, res: Response): Promise<void> {
    try {
      const { number_count, selected_days, selected_weeks, call_frequency_setting, timeZone,label } = req.body;

      // Validate that at least selected_days exists
      // if (!selected_days || selected_days.length === 0) {
      //   res.status(400).json(
      //     errorWithData("selected_days is required", null, 400)
      //   );
      //   return;
      // }

      // Prepare payload
      const payload = { number_count, selected_days, selected_weeks, call_frequency_setting, timeZone, label };
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
//   static async update(req: Request, res: Response): Promise<void> {
//   try {
//     const { id, call_frequency_setting, timeZone } = req.body;

//     // Validate ID
//     if (!id) {
//       res.status(400).json(errorWithData("ID parameter is required", null, 400));
//       return;
//     }

//     // Validate call_frequency_setting
//     if (!call_frequency_setting) {
//       res.status(400).json(errorWithData("call_frequency_setting is required", null, 400));
//       return;
//     }

//     // Optional: validate cron expression using cron-validator
//     const { isValidCron } = await import("cron-validator");
//     if (!isValidCron(call_frequency_setting, { seconds: false })) {
//       res.status(400).json(
//         errorWithData(
//           "Invalid cron expression. Example of valid cron: '30 5 * * 1,6'",
//           call_frequency_setting,
//           400
//         )
//       );
//       return;
//     }

//     // Prepare payload
//     const payload = { call_frequency_setting, timeZone };
//     const updated = await service.update(id, payload);

//     if (!updated) {
//       res.status(404).json(errorWithData("Call frequency setting not found", null, 404));
//       return;
//     }

//     res.status(200).json(
//       successWithData("Call frequency setting updated successfully", updated, undefined, 200)
//     );
//   } catch (err: any) {
//     console.error(err);
//     res.status(500).json(
//       errorWithData("Failed to update call frequency setting", err.message, 500)
//     );
//   }
// }

static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id, call_frequency_setting, timeZone,label } = req.body;

      // Validate ID
      // if (!id) {
      //   res.status(400).json(errorWithData("ID parameter is required", null, 400));
      //   return;
      // }

      // Validate call_frequency_setting
      if (!call_frequency_setting) {
        res.status(400).json(errorWithData("call_frequency_setting is required", null, 400));
        return;
      }

      // Optional: validate cron expression using cron-validator
      const { isValidCron } = await import("cron-validator");
      if (!isValidCron(call_frequency_setting, { seconds: false })) {
        res.status(400).json(
          errorWithData(
            "Invalid cron expression. Example of valid cron: '30 5 * * 1,6'",
            call_frequency_setting,
            400
          )
        );
        return;
      }

      // Prepare payload
      const payload = { call_frequency_setting, timeZone,label };

      // Save frequency setting (insert if not exists, update if exists)
      const result = await service.updateOrInsert(id, payload);

      res.status(200).json(
        successWithData(
          "Call frequency setting saved successfully",
          result,
          undefined,
          200
        )
      );
    } catch (err: any) {
      console.error(err);
      res.status(500).json(
        errorWithData("Failed to save call frequency setting", err.message, 500)
      );
    }
  }

  // 🧩 Create AWS EventBridge schedule
  static async createEventBridgeSchedule(req: Request, res: Response) {
    try {
      // Static cron expression for now
      const cronExpression = "35 21 * * *"; // 9:35 PM every day
      const region = "eu-north-1";



      // Initialize AWS SDK
      const scheduler = new AWS.Scheduler({ region });

      //  Lambda ARN (replace with your actual ARN)
      const lambdaArn = "arn:aws:lambda:eu-north-1:691903504845:function:createHttpCallForFrequency";
      // IAM role ARN that allows EventBridge to invoke Lambda
      const roleArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole";

      const params = {
        Name: "StaticCallFrequencySchedule",
        ScheduleExpression: `cron(0/2 * * * ? *)`, 
        FlexibleTimeWindow: { Mode: "OFF" },
        Target: {
          Arn: lambdaArn,
          RoleArn: roleArn,
        },
      };

      const result = await scheduler.createSchedule(params).promise();
      res.status(200).json(successWithData("EventBridge schedule created successfully", result));
    } catch (err: any) {
      console.error("Error creating EventBridge schedule:", err);
      res.status(500).json(errorWithData("Failed to create schedule", err.message));
    }
  }

}
