import cron from "node-cron";
import axios from "axios";
import { AppDataSource } from "../config/database";
import { CallFrequencySetting } from "../entities/CallFrequencySetting";

export class CallScheduler {
  private static scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Load all call frequency settings from DB and schedule them
   */
  static async initialize() {
    try {
      const repo = AppDataSource.getRepository(CallFrequencySetting);
      const settings = await repo.find({ where: { isDeleted: false } });

      console.log(`🔁 Found ${settings.length} frequency settings in DB`);

      for (const setting of settings) {
        if (setting.call_frequency_setting) {
          this.scheduleFromDB(setting.id, setting.call_frequency_setting);
        }
      }
    } catch (err: any) {
      console.error("❌ Failed to initialize call schedulers:", err.message);
    }
  }

  /**
   * Schedule job using cron expression from DB
   */
  static scheduleFromDB(id: string, cronExpression: string) {
    try {
      if (!cron.validate(cronExpression)) {
        console.warn(`⚠️ Invalid cron expression for ID ${id}: ${cronExpression}`);
        return;
      }

      // If a job already exists, cancel and replace
      if (this.scheduledJobs.has(id)) {
        this.scheduledJobs.get(id)?.stop();
        this.scheduledJobs.delete(id);
      }

      const job = cron.schedule(cronExpression, async () => {
        console.log(`[${new Date().toLocaleString()}] 🔔 Triggering API for ID ${id}`);

        try {
          await axios.get("https://api.trakify.in/crm-data/call/start-batch-calling");
          console.log("✅ API called successfully for ID:", id);
        } catch (err: any) {
          console.error(`❌ Failed API call for ID ${id}:`, err.message);
        }
      });

      this.scheduledJobs.set(id, job);
      console.log(`✅ Scheduled ID ${id} with cron: ${cronExpression}`);
    } catch (err: any) {
      console.error(`❌ Failed to schedule job ${id}:`, err.message);
    }
  }
}
