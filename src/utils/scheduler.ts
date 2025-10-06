// utils/CallScheduler.ts
import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { CallFrequencySetting } from "../entities/CallFrequencySetting";
import { CRMData } from "../entities/CRMData";
import { ScheduledCallHistory } from "../entities/ScheduledCallHistory";
import { CRMDataService, RetellTask } from "../services/CRMData.service";

export class CallScheduler {
  // Track scheduled cron jobs in memory
  private static scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all cron jobs from DB
   */
  static async initialize() {
    const freqRepo = AppDataSource.getRepository(CallFrequencySetting);
    const settings = await freqRepo.find({ where: { isDeleted: false, isActive: true } });

    console.log(`🔁 Found ${settings.length} active call frequency settings`);

    for (const setting of settings) {
      if (setting.call_frequency_setting) {
        this.scheduleFromDB(setting.id, setting.call_frequency_setting);
      }
    }
  }

  /**
   * Schedule a single cron job from DB
   */
  static scheduleFromDB(id: string, cronExpression: string) {
    if (!cron.validate(cronExpression)) {
      console.warn(`⚠️ Invalid cron expression for ID ${id}: ${cronExpression}`);
      return;
    }

    // Stop existing job if it exists
    if (this.scheduledJobs.has(id)) {
      this.scheduledJobs.get(id)?.stop();
      this.scheduledJobs.delete(id);
    }

    const job = cron.schedule(
      cronExpression,
      async () => {
        const nowIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        console.log(`[${nowIST}] 🔔 Triggering calls for frequency ID ${id}`);

        const historyRepo = AppDataSource.getRepository(ScheduledCallHistory);
        let historyRecord: ScheduledCallHistory | null = null;

        try {
          const crmRepo = AppDataSource.getRepository(CRMData);

          // Fetch only leads that still need to be called
          const leads = await crmRepo.find({ where: { need_to_call: true } });

          if (leads.length === 0) {
            console.log("No leads to call at this time.");
            return;
          }

          // Map leads to RetellTask
          const tasks: RetellTask[] = leads
            .filter((lead) => lead.mobile_number)
            .map((lead) => ({
              to_number: lead.mobile_number.startsWith("+") ? lead.mobile_number : `+${lead.mobile_number}`,
              retell_llm_dynamic_variables: {
                name: lead.name || "",
                lead_id: lead.lead_id || "",
                unique_id: lead.unique_id || "",
                greeting: `Hello ${lead.name || "there"}, this is a test call from Retell!`,
              },
            }));

          console.log(`📞 Sending ${tasks.length} tasks to RetellAI...`);

          // Log history as pending
          historyRecord = historyRepo.create({
            frequencySetting: { id } as CallFrequencySetting,
            executedAt: new Date(),
            status: "pending",
          });
          await historyRepo.save(historyRecord);

          // Call RetellAI
          const retellResponse = await CRMDataService.createBatchCall(tasks);
          console.log("✅ RetellAI batch call response:", retellResponse);

          // Mark all called leads as done
          if (retellResponse) {
            for (const lead of leads) {
              lead.need_to_call = false;
              await crmRepo.save(lead);
            }

            // Update history record
            historyRecord.status = "success";
            historyRecord.responseData = JSON.stringify(retellResponse);
            await historyRepo.save(historyRecord);

            console.log(`✅ Marked ${leads.length} leads as called`);
          } else {
            console.warn("⚠️ RetellAI response null – leads not updated");
            historyRecord.status = "failed";
            historyRecord.errorMessage = "RetellAI returned null";
            await historyRepo.save(historyRecord);
          }
        } catch (error: any) {
          console.error("❌ Error running scheduled calls:", error?.response?.data || error.message);
          if (historyRecord) {
            historyRecord.status = "failed";
            historyRecord.errorMessage = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
            await historyRepo.save(historyRecord);
          }
        }

        console.log(`✅ Completed calls for frequency ID ${id}`);
      },
      { timezone: "Asia/Kolkata" }
    );

    // Store the scheduled job
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
