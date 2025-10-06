// utils/CallScheduler.ts
import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { CallFrequencySetting } from "../entities/CallFrequencySetting";
import { CRMData } from "../entities/CRMData";
import { CRMDataService, RetellTask } from "../services/CRMData.service";

export class CallScheduler {
  // Keep track of all scheduled cron jobs
  private static scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize scheduler: load all cron expressions from DB and schedule them
   */
  static async initialize() {
    const freqRepo = AppDataSource.getRepository(CallFrequencySetting);

    // Fetch all active call frequency settings
    const settings = await freqRepo.find({ where: { isDeleted: false } });
    console.log(`🔁 Found ${settings.length} call frequency settings`);

    for (const setting of settings) {
      if (setting.call_frequency_setting) {
        this.scheduleFromDB(setting.id, setting.call_frequency_setting);
      }
    }
  }

  /**
   * Schedule a single cron job from DB
   * @param id - Frequency setting ID
   * @param cronExpression - Cron expression string
   */
  static scheduleFromDB(id: string, cronExpression: string) {
    if (!cron.validate(cronExpression)) {
      console.warn(`⚠️ Invalid cron expression for ID ${id}: ${cronExpression}`);
      return;
    }

    // Stop existing job if already scheduled
    if (this.scheduledJobs.has(id)) {
      this.scheduledJobs.get(id)?.stop();
      this.scheduledJobs.delete(id);
    }

    // Schedule new cron job in IST timezone
    const job = cron.schedule(
      cronExpression,
      async () => {
        const nowIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        console.log(`[${nowIST}] 🔔 Triggering calls for frequency ID ${id}`);

        try {
          const crmRepo = AppDataSource.getRepository(CRMData);

          // Fetch only leads that still need to be called
          const leads = await crmRepo.find({ where: { need_to_call: true } });

          // Map leads to RetellTask format
          const tasks: RetellTask[] = leads
            .filter((lead) => lead.mobile_number)
            .map((lead) => ({
              to_number: lead.mobile_number,
              retell_llm_dynamic_variables: {
                name: lead.name,
                lead_id: lead.lead_id,
                unique_id: lead.unique_id,
                greeting: `Hello ${lead.name}, this is a test call from Retell!`,
              },
            }));

          if (tasks.length > 0) {
            // Call the RetellAI API
            const retellResponse = await CRMDataService.createBatchCall(tasks);
            console.log("✅ RetellAI batch call response:", retellResponse);

            // Mark all called leads as done
            for (const lead of leads) {
              lead.need_to_call = false;
              await crmRepo.save(lead);
            }
          } else {
            console.log("No leads to call at this time.");
          }
        } catch (error: any) {
          console.error(
            "❌ Error running scheduled calls:",
            error?.response?.data || error.message
          );
        }

        console.log(`✅ Completed calls for frequency ID ${id}`);
      },
      { timezone: "Asia/Kolkata" } // Ensure cron runs in IST
    );

    // Save the scheduled job in the map
    this.scheduledJobs.set(id, job);
    console.log(`✅ Scheduled frequency ID ${id} with cron: ${cronExpression} (IST)`);
  }

  /**
   * Stop a scheduled job by ID
   */
  static stopJob(id: string) {
    if (this.scheduledJobs.has(id)) {
      this.scheduledJobs.get(id)?.stop();
      this.scheduledJobs.delete(id);
      console.log(`🛑 Stopped scheduled job for frequency ID ${id}`);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  static stopAllJobs() {
    for (const [id, job] of this.scheduledJobs) {
      job.stop();
      console.log(`🛑 Stopped scheduled job for frequency ID ${id}`);
    }
    this.scheduledJobs.clear();
  }
}
