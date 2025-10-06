// utils/CallScheduler.ts
import cron from "node-cron";
import fetch from "node-fetch"; // npm i node-fetch@2
import { AppDataSource } from "../config/database";
import { CallFrequencySetting } from "../entities/CallFrequencySetting";
import { CRMData } from "../entities/CRMData";
import { ScheduledCallHistory } from "../entities/ScheduledCallHistory";
import { CRMDataService, RetellTask } from "../services/CRMData.service";

export class CallScheduler {
  private static scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

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

  static scheduleFromDB(id: string, cronExpression: string) {
    if (!cron.validate(cronExpression)) {
      console.warn(`Invalid cron expression for ID ${id}: ${cronExpression}`);
      return;
    }

    // Stop existing job if exists
    if (this.scheduledJobs.has(id)) {
      this.scheduledJobs.get(id)?.stop();
      this.scheduledJobs.delete(id);
    }

    const job = cron.schedule(
      cronExpression,
      async () => {
        const nowIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        console.log(`[${nowIST}] Triggering calls for frequency ID ${id}`);

        const crmRepo = AppDataSource.getRepository(CRMData);
        const historyRepo = AppDataSource.getRepository(ScheduledCallHistory);

        try {
          const leads = await crmRepo.find({ where: { need_to_call: true } });
          if (leads.length === 0) {
            console.log("No leads to call at this time.");
            return;
          }

          for (const lead of leads) {
            let historyRecord = historyRepo.create({
              frequencySetting: { id } as CallFrequencySetting,
              executedAt: new Date(),
              status: "pending",
            });
            await historyRepo.save(historyRecord);

            try {
              // --- Call webhook ---
              console.log(`Calling webhook for lead ${lead.lead_id}...`);
              const webhookResponse = await fetch("https://webhook.site/f7a7244b-700a-4bd2-861d-035937fd018c");
              const webhookData = await webhookResponse.json();
              console.log("Webhook response:", webhookData);

              historyRecord.webhookResponse = JSON.stringify(webhookData);
              await historyRepo.save(historyRecord);

              if (!webhookData?.result) {
                historyRecord.status = "skipped";
                historyRecord.errorMessage = "Webhook returned false";
                await historyRepo.save(historyRecord);
                console.warn(`Webhook skipped for lead ${lead.lead_id}`);
                continue;
              }

              // --- Call RetellAI ---
              const task: RetellTask = {
                to_number: lead.mobile_number.startsWith("+") ? lead.mobile_number : `+${lead.mobile_number}`,
                retell_llm_dynamic_variables: {
                  name: lead.name || "",
                  lead_id: lead.lead_id || "",
                  unique_id: lead.unique_id || "",
                  greeting: `Hello ${lead.name || "there"}, this is a test call from Retell!`,
                },
              };

              const retellResponse = await CRMDataService.createBatchCall([task]);
              historyRecord.status = retellResponse ? "success" : "failed";
              historyRecord.responseData = JSON.stringify(retellResponse);
              await historyRepo.save(historyRecord);

              if (retellResponse) {
                lead.need_to_call = false;
                await crmRepo.save(lead);
                console.log(`✅ Lead ${lead.lead_id} marked as called`);
              }

            } catch (leadError: any) {
              console.error(`❌ Error processing lead ${lead.lead_id}:`, leadError.message);
              historyRecord.status = "failed";
              historyRecord.errorMessage = leadError?.message || "Unknown error";
              await historyRepo.save(historyRecord);
            }
          }

          console.log(`✅ Completed all leads for frequency ID ${id}`);

        } catch (error: any) {
          console.error("❌ Error fetching leads:", error.message);
        }
      },
      { timezone: "Asia/Kolkata" }
    );

    this.scheduledJobs.set(id, job);
    console.log(`✅ Scheduled frequency ID ${id} with cron: ${cronExpression} (IST)`);
  }

  static stopJob(id: string) {
    if (this.scheduledJobs.has(id)) {
      this.scheduledJobs.get(id)?.stop();
      this.scheduledJobs.delete(id);
      console.log(`🛑 Stopped scheduled job for frequency ID ${id}`);
    }
  }

  static stopAllJobs() {
    for (const [id, job] of this.scheduledJobs) {
      job.stop();
      console.log(`🛑 Stopped scheduled job for frequency ID ${id}`);
    }
    this.scheduledJobs.clear();
  }
}
