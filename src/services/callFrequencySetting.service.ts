

//--------------old code by savita mam ---------------

// import { AppDataSource } from "../config/database";
// import { CallFrequencySetting } from "../entities/CallFrequencySetting";
// import { Repository } from "typeorm";
// import parser from "cron-parser";
// import { DateTime } from "luxon";

// interface CallFrequencyInput {
//   // number_count?: number;
//   // selected_days?: string[];
//   // selected_weeks?: string[];
//   call_frequency_setting: string;
//   timeZone: string;
// }

// export class CallFrequencySettingService {
//   private repo: Repository<CallFrequencySetting>;

//   constructor() {
//     this.repo = AppDataSource.getRepository(CallFrequencySetting);
//   }

  // Generate cron expression based on selected days and weeks
  // private generateCron(input: CallFrequencyInput): string {
  //   // Example: map days to cron numbers (Monday=1, Sunday=0)
  //   const dayMap: Record<string, number> = {
  //     Sunday: 0,
  //     Monday: 1,
  //     Tuesday: 2,
  //     Wednesday: 3,
  //     Thursday: 4,
  //     Friday: 5,
  //     Saturday: 6,
  //   };

  //   const dayNumbers = (input.selected_days || []).map(d => dayMap[d]).join(",");

  //   // Example: you can also use number_count or selected_weeks in logic
  //   // For simplicity, we'll just set hour 5, minute 30
  //   const cron = `30 5 * * ${dayNumbers || "*"}`; // runs at 05:30 on selected days
  //   return cron;
  // }

  // Create new frequency setting
  // async create(data: CallFrequencyInput): Promise<CallFrequencySetting> {
  //   const entity = this.repo.create({
  //     // number_count: data.number_count,
  //     // selected_days: data.selected_days ? JSON.stringify(data.selected_days) : null,
  //     // selected_weeks: data.selected_weeks ? JSON.stringify(data.selected_weeks) : null,
  //     call_frequency_setting: data.call_frequency_setting, // use user input directly
  //     timeZone: data.timeZone, // use user input directly
  //   });

  //   return await this.repo.save(entity);
  // }

  // Get all active records
  // async getAll(): Promise<CallFrequencySetting[]> {
  //   return await this.repo.find({
  //     where: { isDeleted: false },
  //     order: { createdAt: "DESC" },
  //   });
  // }

  // Update existing frequency setting by ID
  // async update(id: string, data: CallFrequencyInput): Promise<CallFrequencySetting | null> {
  //   const existing = await this.repo.findOne({ where: { id } });
  //   const [min, hour, day, month, weekday] = data.call_frequency_setting.split(" ");

  //   // Use an arbitrary date to perform conversion (the day/month/weekday don't matter)
  //   const originalTime = DateTime.fromObject(
  //     { hour: parseInt(hour), minute: parseInt(min) },
  //     { zone: "UTC" }
  //   );

  //   const convertedTime = originalTime.setZone(data.timeZone);

  //   const newMin = convertedTime.minute;
  //   const newHour = convertedTime.hour;

  //   const timeConvertedCronExpression =   `${newMin} ${newHour} ${day} ${month} ${weekday}`;

  //   if (!existing) return null;
  //   // existing.call_frequency_setting = data.call_frequency_setting;
  //   existing.call_frequency_setting = timeConvertedCronExpression
  //   existing.timeZone = data.timeZone;

  //   return await this.repo.save(existing);
  // }
// Update existing frequency setting by ID, or insert if not exists
// async updateOrInsert(id: string, data: CallFrequencyInput): Promise<CallFrequencySetting> {
//   // Find existing record
//   let existing = await this.repo.findOne({ where: { id } });

//   const [min, hour, day, month, weekday] = data.call_frequency_setting.split(" ");

//   // Convert time based on timezone
//   const originalTime = DateTime.fromObject(
//     { hour: parseInt(hour), minute: parseInt(min) },
//     { zone: "UTC" }
//   );

//   const convertedTime = originalTime.setZone(data.timeZone);

//   const newMin = convertedTime.minute;
//   const newHour = convertedTime.hour;

//   const timeConvertedCronExpression = `${newMin} ${newHour} ${day} ${month} ${weekday}`;

//   if (!existing) {
//     // Insert new record
//     existing = this.repo.create({
//       id,
//       call_frequency_setting: timeConvertedCronExpression,
//       timeZone: data.timeZone,
//     });
//   } else {
//     // Update existing record
//     existing.call_frequency_setting = timeConvertedCronExpression;
//     existing.timeZone = data.timeZone;
//   }

//   return await this.repo.save(existing);
// }

// async updateOrInsert(id: string, data: CallFrequencyInput): Promise<CallFrequencySetting> {
//   let existing = await this.repo.findOne({ where: { id } });
//   const [min, hour, day, month, weekday] = data.call_frequency_setting.split(" ");

//   let timeConvertedCronExpression = data.call_frequency_setting;

//   // Only convert if both are single numeric values
//   if (/^\d+$/.test(min) && /^\d+$/.test(hour)) {
//     const originalTime = DateTime.fromObject(
//       { hour: parseInt(hour), minute: parseInt(min) },
//       { zone: "UTC" }
//     );

//     const convertedTime = originalTime.setZone(data.timeZone);

//     const newMin = convertedTime.minute;
//     const newHour = convertedTime.hour;

//     timeConvertedCronExpression = `${newMin} ${newHour} ${day} ${month} ${weekday}`;
//   }

//   if (!existing) {
//     existing = this.repo.create({
//       id,
//       call_frequency_setting: timeConvertedCronExpression,
//       timeZone: data.timeZone,
//     });
//   } else {
//     existing.call_frequency_setting = timeConvertedCronExpression;
//     existing.timeZone = data.timeZone;
//   }

//   return await this.repo.save(existing);
// }

// }


//--------------new code by sarang AWS cron job ---------------

import { AppDataSource } from "../config/database";
import { CallFrequencySetting } from "../entities/CallFrequencySetting";
import { Repository } from "typeorm";
import { DateTime } from "luxon";
import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

interface CallFrequencyInput {
  call_frequency_setting: string;
  timeZone: string;
}

export class CallFrequencySettingService {
  private repo: Repository<CallFrequencySetting>;
  private eventBridge: AWS.EventBridge;
  private lambda: AWS.Lambda;

  constructor() {
    this.repo = AppDataSource.getRepository(CallFrequencySetting);

    // Initialize AWS clients
    this.eventBridge = new AWS.EventBridge({
      region: process.env.AWS_REGION_FOR_LAMBDA,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_FOR_LAMBDA,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_FOR_LAMBDA,
    });

    this.lambda = new AWS.Lambda({
      region: process.env.AWS_REGION_FOR_LAMBDA,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID_FOR_LAMBDA,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_FOR_LAMBDA,
    });
  }

  // -----------------------------------------------------------------
  // Create frequency setting in DB
  async create(data: CallFrequencyInput): Promise<CallFrequencySetting> {
    const entity = this.repo.create({
      call_frequency_setting: data.call_frequency_setting,
      timeZone: data.timeZone,
    });
    return await this.repo.save(entity);
  }

  // -----------------------------------------------------------------
  // Get all active frequency settings
  async getAll(): Promise<CallFrequencySetting[]> {
    return await this.repo.find({
      where: { isDeleted: false },
      order: { createdAt: "DESC" },
    });
  }

  // -----------------------------------------------------------------
  // Update or insert a record
  async updateOrInsert(id: string, data: CallFrequencyInput): Promise<CallFrequencySetting> {
    let existing = await this.repo.findOne({ where: { id } });
    const [min, hour, day, month, weekday] = data.call_frequency_setting.split(" ");

    let timeConvertedCronExpression = data.call_frequency_setting;

    if (/^\d+$/.test(min) && /^\d+$/.test(hour)) {
      const originalTime = DateTime.fromObject(
        { hour: parseInt(hour), minute: parseInt(min) },
        { zone: "UTC" }
      );
      const convertedTime = originalTime.setZone(data.timeZone);
      const newMin = convertedTime.minute;
      const newHour = convertedTime.hour;
      timeConvertedCronExpression = `${newMin} ${newHour} ${day} ${month} ${weekday}`;
    }

    if (!existing) {
      existing = this.repo.create({
        id,
        call_frequency_setting: timeConvertedCronExpression,
        timeZone: data.timeZone,
      });
    } else {
      existing.call_frequency_setting = timeConvertedCronExpression;
      existing.timeZone = data.timeZone;
    }

    return await this.repo.save(existing);
  }

  // -----------------------------------------------------------------
  // 🧩 Create AWS EventBridge Schedule
  async createEventBridgeSchedule(timeZone: string = "Asia/Kolkata"): Promise<any> {
    try {
      const lambdaFunctionName = "createHttpCallForFrequency";
      const ruleName = "CallFrequencySchedulerRule";

      // Static cron expression for every 5 minutes
      // const staticCronExpression = "cron(0/5 * * * ? *)";

       // 1️⃣ Fetch the latest active call frequency setting
    const settings = await this.getAll();
    if (!settings || settings.length === 0) {
      throw new Error("No active call frequency settings found");
    }

    // Take the latest one
    const latestSetting = settings[0];
    const staticCronExpression = latestSetting.call_frequency_setting;
console.log(staticCronExpression, "staticCronExpression======");
      // 1️⃣ Create or update the rule
      const ruleParams = {
        Name: ruleName,
        ScheduleExpression: staticCronExpression,
        State: "ENABLED",
        Description: "Triggers createHttpCallForFrequency Lambda periodically",
      };
      const rule = await this.eventBridge.putRule(ruleParams).promise();
      console.log("✅ Rule created:", rule.RuleArn);

      // 2️⃣ Add Lambda invoke permission
      try {
        await this.lambda
          .addPermission({
            Action: "lambda:InvokeFunction",
            FunctionName: lambdaFunctionName,
            Principal: "events.amazonaws.com",
            StatementId: `${ruleName}-InvokePermission`,
            SourceArn: rule.RuleArn,
          })
          .promise();
        console.log("✅ Lambda permission added");
      } catch (err: any) {
        if (err.code === "ResourceConflictException") {
          console.log("ℹ️ Lambda permission already exists");
        } else {
          throw err;
        }
      }

      // 3️⃣ Link rule to Lambda target
      const targetParams = {
        Rule: ruleName,
        Targets: [
          {
            Id: "1",
            Arn: `arn:aws:lambda:${process.env.AWS_REGION_FOR_LAMBDA}:${process.env.AWS_ACCOUNT_ID_FOR_LAMBDA}:function:${lambdaFunctionName}`,
          },
        ],
      };

      await this.eventBridge.putTargets(targetParams).promise();
      console.log("✅ Target added successfully");

      return { success: true, ruleArn: rule.RuleArn };
    } catch (error: any) {
      console.error("❌ Error creating EventBridge schedule:", error);
      throw new Error(error.message);
    }
  }
}
