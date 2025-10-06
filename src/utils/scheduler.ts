import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { CallFrequencySetting } from "../entities/CallFrequencySetting";
import { CRMData } from "../entities/CRMData";
import axios from "axios";

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

    // Schedule job with IST timezone
    const job = cron.schedule(
      cronExpression,
      async () => {
        const nowIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        console.log(`[${nowIST}] 🔔 Triggering calls for frequency ID ${id}`);

        const crmRepo = AppDataSource.getRepository(CRMData);
        // Fetch only leads that need to be called
        const leads = await crmRepo.find({ where: { need_to_call: true } });

        const tasks = leads
          .filter(l => l.mobile_number)
          .map(l => ({
            to_number: l.mobile_number,
            retell_llm_dynamic_variables: {
              name: l.name,
              lead_id: l.lead_id,
              unique_id: l.unique_id,
              greeting: `Hello ${l.name}, this is a test call from Retell!`,
            },
          }));

        if (tasks.length > 0) {
          const payload = {
            from_number: process.env.RETELL_FROM_NUMBER,
            tasks,
            retell_llm_dynamic_variables: { greeting: "Hello, this is a test call from Retell!" },
          };

          try {
            const response = await axios.post(
              "https://api.retellai.com/create-batch-call",
              payload,
              {
                headers: {
                  Authorization: `Bearer ${process.env.API_KEY_RETELL}`,
                  "Content-Type": "application/json",
                },
              }
            );

            console.log("✅ RetellAI batch call response:", response.data);

            // Mark all leads as called
            for (const lead of leads) {
              lead.need_to_call = false;
              await crmRepo.save(lead);
            }
          } catch (err: any) {
            console.error("❌ RetellAI API error:", err.response?.data || err.message);
          }
        } else {
          console.log("No leads to call at this time.");
        }

        console.log(`✅ Completed calls for frequency ID ${id}`);
      },
      { timezone: "Asia/Kolkata" } // triggers cron job in IST
    );

    this.scheduledJobs.set(id, job);
    console.log(`✅ Scheduled frequency ID ${id} with cron: ${cronExpression} (IST)`);
  }
}
