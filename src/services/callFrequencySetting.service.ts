// import { AppDataSource } from "../config/database";
// import { CallFrequencySetting } from "../entities/CallFrequencySetting";
// import { Repository } from "typeorm";
// import dotenv from "dotenv";
// import {
//   SchedulerClient,
//   CreateScheduleCommand,
//   UpdateScheduleCommand,
//   GetScheduleCommand,
//   ScheduleState,
//   CreateScheduleCommandInput,
//   UpdateScheduleCommandInput,
// } from "@aws-sdk/client-scheduler";

// dotenv.config();

// interface CallFrequencyInput {
//   call_frequency_setting: string; // Standard 5-field cron: min hour day month weekday
//   timeZone: string;
//   label: string;
//   isActive?: boolean;
// }

// export class CallFrequencySettingService {
//   private repo: Repository<CallFrequencySetting>;
//   private schedulerClient: SchedulerClient;

//   constructor() {
//     this.repo = AppDataSource.getRepository(CallFrequencySetting);

//     this.schedulerClient = new SchedulerClient({
//       region: process.env.AWS_REGION_FOR_LAMBDA,
//       credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID_FOR_LAMBDA!,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_FOR_LAMBDA!,
//       },
//     });
//   }

//   // -------------------- DB Methods --------------------
//   async create(data: CallFrequencyInput): Promise<CallFrequencySetting> {
//     const entity = this.repo.create(data);
//     return await this.repo.save(entity);
//   }

//   async getAll(): Promise<CallFrequencySetting[]> {
//     return await this.repo.find({
//       where: { isDeleted: false },
//       order: { createdAt: "DESC" },
//     });
//   }

//   // -------------------- AWS Cron Conversion --------------------
//   private convertToAwsCron(cron: string): string {
//     // Expect standard 5-field cron: minute hour dayOfMonth month dayOfWeek
//     const parts = cron.trim().split(" ");
//     if (parts.length !== 5) throw new Error("Invalid cron format. Must have 5 fields.");

//     let [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

//     // Step format like */5
//     if (minute.includes("*/")) {
//       minute = `0/${minute.replace("*/", "")}`;
//     }

//     // Ensure AWS compliance: either dayOfMonth or dayOfWeek must be '?'
//     const isDayOfMonthNumeric = !isNaN(Number(dayOfMonth));
//     const isDayOfWeekNumeric = !isNaN(Number(dayOfWeek));

//     if (isDayOfMonthNumeric && isDayOfWeekNumeric) {
//       dayOfWeek = "?";
//     } else if (!isDayOfMonthNumeric && isDayOfWeekNumeric) {
//       dayOfWeek = dayOfWeek;
//     } else if (isDayOfMonthNumeric && !isDayOfWeekNumeric) {
//       dayOfWeek = "?";
//     } else {
//       dayOfWeek = "?";
//     }

//     return `cron(${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek} *)`;
//   }

//   // -------------------- Main Update Logic --------------------
//   async updateOrInsert(
//     id: string,
//     data: CallFrequencyInput & { isActive?: boolean }
//   ): Promise<CallFrequencySetting> {
//     console.log("\n⚙️ [updateOrInsert] Incoming data:", data);

//     let existing = await this.repo.findOne({ where: { id } });
//     console.log(existing ? "🟢 Found existing record" : "🆕 Creating new record");

//     const awsCron = this.convertToAwsCron(data.call_frequency_setting);
//     console.log("🕒 Converted AWS cron:", awsCron);

//     if (!existing) {
//       existing = this.repo.create({
//         id,
//         call_frequency_setting: awsCron,
//         timeZone: data.timeZone,
//         label: data.label,
//         isActive: data.isActive ?? true,
//       });
//     } else {
//       existing.call_frequency_setting = awsCron;
//       existing.timeZone = data.timeZone;
//       existing.label = data.label;
//       if (data.isActive !== undefined) existing.isActive = data.isActive;
//     }

//     const saved = await this.repo.save(existing);
//     console.log("💾 Saved DB record:", saved);

//     // -------------------- Handle Scheduler --------------------
//     if (saved.isActive === false) {
//       console.log("⏸️ Schedule is INACTIVE — disabling AWS schedule");
//       try {
//         await this.toggleScheduler("DISABLED");
//       } catch (err) {
//         console.error("❌ Failed to disable AWS schedule:", err);
//       }
//       return saved;
//     }

//     console.log("🚀 Schedule is ACTIVE — creating/updating AWS scheduler");
//     try {
//       await this.createOrUpdateScheduler(saved.call_frequency_setting, saved.timeZone);
//     } catch (err) {
//       console.error("❌ Failed to create/update AWS schedule:", err);
//     }

//     return saved;
//   }

//   // -------------------- AWS Scheduler Methods --------------------
//   private async createOrUpdateScheduler(cronExpression: string, timeZone: string) {
//     console.log("🧠 [createOrUpdateScheduler] Cron:", cronExpression, "| TZ:", timeZone);

//     const params: CreateScheduleCommandInput = {
//       Name: process.env.SCHEDULE_NAME!,
//       Description: process.env.SCHEDULE_DESCRIPTION || "Triggers Lambda",
//       ScheduleExpression: cronExpression,
//       ScheduleExpressionTimezone: timeZone,
//       FlexibleTimeWindow: { Mode: "OFF" },
//       Target: {
//         Arn: process.env.LAMBDA_ARN!,
//         RoleArn: process.env.ROLE_ARN!,
//         Input: JSON.stringify({ timestamp: new Date().toISOString() }),
//       },
//     };

//     try {
//       console.log("🆕 Trying to create AWS schedule...");
//       return await this.schedulerClient.send(new CreateScheduleCommand(params));
//     } catch (err: any) {
//       if (err.name === "ConflictException") {
//         console.log("🔁 Schedule already exists → updating instead...");
//         const updateParams: UpdateScheduleCommandInput = {
//           ...params,
//           Name: process.env.SCHEDULE_NAME!,
//         };
//         return await this.schedulerClient.send(new UpdateScheduleCommand(updateParams));
//       }
//       throw err;
//     }
//   }

//   async toggleScheduler(newState: ScheduleState): Promise<any> {
//     console.log(`⚡ [toggleScheduler] Changing schedule state to: ${newState}`);
//     try {
//       const existing = await this.schedulerClient.send(
//         new GetScheduleCommand({ Name: process.env.SCHEDULE_NAME! })
//       );

//       if (!existing || !existing.Target) throw new Error("Schedule not found or missing target");

//       const params: UpdateScheduleCommandInput = {
//         Name: process.env.SCHEDULE_NAME!,
//         Description: existing.Description,
//         ScheduleExpression: existing.ScheduleExpression!,
//         FlexibleTimeWindow: existing.FlexibleTimeWindow,
//         Target: existing.Target,
//         State: newState,
//       };

//       const response = await this.schedulerClient.send(new UpdateScheduleCommand(params));
//       console.log("✅ Scheduler state updated successfully:", response);
//       return response;
//     } catch (error) {
//       console.error(`❌ Failed to ${newState === "ENABLED" ? "enable" : "disable"} schedule:`, error);
//       throw error;
//     }
//   }
// }



import { AppDataSource } from "../config/database";
import { CallFrequencySetting } from "../entities/CallFrequencySetting";
import { Repository } from "typeorm";
import dotenv from "dotenv";
import {
  SchedulerClient,
  CreateScheduleCommand,
  UpdateScheduleCommand,
  GetScheduleCommand,
  ScheduleState,
  CreateScheduleCommandInput,
  UpdateScheduleCommandInput,
} from "@aws-sdk/client-scheduler";
 
dotenv.config();
 
interface CallFrequencyInput {
  call_frequency_setting: string;
  timeZone: string;
  label: string;
  isActive?: boolean;
}
 
export class CallFrequencySettingService {
  private repo: Repository<CallFrequencySetting>;
  private schedulerClient: SchedulerClient;
 
  constructor() {
    this.repo = AppDataSource.getRepository(CallFrequencySetting);
 
    this.schedulerClient = new SchedulerClient({
      region: process.env.AWS_REGION_FOR_LAMBDA,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_FOR_LAMBDA!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_FOR_LAMBDA!,
      },
    });
  }
 
  // -------------------- DB METHODS --------------------
  async create(data: CallFrequencyInput): Promise<CallFrequencySetting> {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }
 
  async getAll(): Promise<CallFrequencySetting[]> {
    return await this.repo.find({
      where: { isDeleted: false },
      order: { createdAt: "DESC" },
    });
  }
 
  // -------------------- CRON CONVERSION --------------------
  /**
   * Converts a standard or AWS cron string to a valid AWS-compatible cron expression.
   * Supports both 5-field (standard Unix) and 6-field (AWS) formats.
   */
  private convertToAwsCron(cron: string): string {
    const clean = cron.trim();
 
    // If already in AWS cron() format, return as-is
    if (clean.startsWith("cron(") && clean.endsWith(")")) {
      console.log(" Already an AWS cron expression:", clean);
      return clean;
    }
 
    const parts = clean.split(" ");
    if (parts.length < 5 || parts.length > 6) {
      throw new Error("Invalid cron format. Expected 5 or 6 fields.");
    }
 
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const year = parts[5] || "*";
 
    // AWS requires ? for one of the day fields
    const safeDayOfMonth = dayOfMonth === "*" ? "?" : dayOfMonth;
    const safeDayOfWeek = dayOfWeek === "*" ? "?" : dayOfWeek;
 
    // Fix */5 to 0/5 format
    const fixedMinute = minute.startsWith("*/") ? `0/${minute.slice(2)}` : minute;
 
    const awsCron = `cron(${fixedMinute} ${hour} ${safeDayOfMonth} ${month} ${safeDayOfWeek} ${year})`;
    console.log(" Converted to AWS cron:", awsCron);
    return awsCron;
  }
 
  // -------------------- MAIN UPDATE / INSERT LOGIC --------------------
  async updateOrInsert(
    id: string,
    data: CallFrequencyInput & { isActive?: boolean }
  ): Promise<CallFrequencySetting> {
    console.log("\n  [updateOrInsert] Incoming data:", data);
 
    let existing = await this.repo.findOne({ where: { id } });
    console.log(existing ? " Found existing record" : " Creating new record");
 
    const awsCron = this.convertToAwsCron(data.call_frequency_setting);
    console.log(" Final AWS Cron Expression:", awsCron);
 
    if (!existing) {
      existing = this.repo.create({
        id,
        call_frequency_setting: awsCron,
        timeZone: data.timeZone,
        label: data.label,
        isActive: data.isActive ?? true,
      });
    } else {
      existing.call_frequency_setting = awsCron;
      existing.timeZone = data.timeZone;
      existing.label = data.label;
      if (data.isActive !== undefined) existing.isActive = data.isActive;
    }
 
    const saved = await this.repo.save(existing);
    console.log(" Saved DB record:", saved);
 
    //  Check active state
    if (saved.isActive === false) {
      console.log("⏸ Schedule is INACTIVE — skipping AWS create/update");
      try {
        console.log(" Disabling AWS schedule...");
        const disableResult = await this.toggleScheduler("DISABLED");
        console.log(" AWS schedule DISABLED successfully:", disableResult);
      } catch (err) {
        console.error(" Failed to disable AWS schedule:", err);
      }
      return saved;
    }
 
    //  If active → create/update AWS scheduler
    console.log(" Schedule is ACTIVE — proceeding to create/update AWS scheduler...");
    try {
      const awsResult = await this.createOrUpdateScheduler(saved.call_frequency_setting, saved.timeZone);
      console.log(" AWS schedule created/updated successfully:", awsResult);
    } catch (err) {
      console.error(" Failed to create/update AWS schedule:", err);
    }
 
    return saved;
  }
 
  // -------------------- AWS SCHEDULER METHODS --------------------
  private async createOrUpdateScheduler(cronExpression: string, timeZone: string) {
    console.log(" [createOrUpdateScheduler] Cron:", cronExpression, "| TZ:", timeZone);
 
    const params: CreateScheduleCommandInput = {
      Name: process.env.SCHEDULE_NAME!,
      Description: process.env.SCHEDULE_DESCRIPTION || "Triggers Lambda",
      ScheduleExpression: cronExpression,
      ScheduleExpressionTimezone: timeZone,
      FlexibleTimeWindow: { Mode: "OFF" },
      Target: {
        Arn: process.env.LAMBDA_ARN!,
        RoleArn: process.env.ROLE_ARN!,
        Input: JSON.stringify({ timestamp: new Date().toISOString() }),
      },
    };
 
    try {
      console.log(" Trying to create AWS schedule...");
      return await this.schedulerClient.send(new CreateScheduleCommand(params));
    } catch (err: any) {
      if (err.name === "ConflictException") {
        console.log(" Schedule already exists → updating instead...");
        const updateParams: UpdateScheduleCommandInput = { ...params, Name: process.env.SCHEDULE_NAME! };
        return await this.schedulerClient.send(new UpdateScheduleCommand(updateParams));
      }
      console.error(" Error in createOrUpdateScheduler:", err);
      throw err;
    }
  }
 
  async toggleScheduler(newState: ScheduleState): Promise<any> {
    console.log(`\n [toggleScheduler] Changing schedule state to: ${newState}`);
 
    try {
      const existing = await this.schedulerClient.send(
        new GetScheduleCommand({ Name: process.env.SCHEDULE_NAME! })
      );
 
      if (!existing || !existing.Target) throw new Error("Schedule not found or missing target");
 
      const params: UpdateScheduleCommandInput = {
        Name: process.env.SCHEDULE_NAME!,
        Description: existing.Description,
        ScheduleExpression: existing.ScheduleExpression!,
        FlexibleTimeWindow: existing.FlexibleTimeWindow,
        Target: existing.Target,
        State: newState,
      };
 
      console.log(" Updating AWS schedule state with params:", params);
      const response = await this.schedulerClient.send(new UpdateScheduleCommand(params));
      console.log(" Scheduler state updated successfully:", response);
      return response;
    } catch (error) {
      console.error(` Failed to ${newState === "ENABLED" ? "enable" : "disable"} schedule:`, error);
      throw error;
    }
  }
}