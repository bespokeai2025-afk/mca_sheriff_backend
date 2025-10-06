import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { CallFrequencySetting } from "../entities/CallFrequencySetting";
import { CRMData } from "../entities/CRMData";

export class CallScheduler {
  private static scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  static async initialize() {
    const freqRepo = AppDataSource.getRepository(CallFrequencySetting);
    const settings = await freqRepo.find({ where: { isDeleted: false } });

    console.log(`🔁 Found ${settings.length} call frequency settings`);

    for (const setting of settings) {
      if (setting.call_frequency_setting) {
        this.scheduleFromDB(setting.id, setting.call_frequency_setting);
      }
    }
  }

  static scheduleFromDB(id: string, cronExpression: string) {
    if (!cron.validate(cronExpression)) {
      console.warn(`⚠️ Invalid cron expression for ID ${id}: ${cronExpression}`);
      return;
    }

    // Stop existing job if any
    if (this.scheduledJobs.has(id)) {
      this.scheduledJobs.get(id)?.stop();
      this.scheduledJobs.delete(id);
    }

    // Schedule new job with timezone set to IST
    const job = cron.schedule(
      cronExpression,
      async () => {
        const nowIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        console.log(`[${nowIST}] 🔔 Triggering calls for frequency ID ${id}`);

        const crmRepo = AppDataSource.getRepository(CRMData);
        const leads = await crmRepo.find({ where: { need_to_call: true } });

        for (const lead of leads) {
          console.log(`Calling lead: ${lead.name} - ${lead.mobile_number}`);

          // TODO: integrate your actual call logic here

          // After processing, mark as called
          lead.need_to_call = false;
          await crmRepo.save(lead);
        }

        console.log(`✅ Completed calls for frequency ID ${id}`);
      },
      {
        timezone: "Asia/Kolkata", // This makes cron trigger in IST
      }
    );

    this.scheduledJobs.set(id, job);
    console.log(`✅ Scheduled frequency ID ${id} with cron: ${cronExpression} (IST)`);
  }
}
