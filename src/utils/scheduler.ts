// utils/CallScheduler.ts
import cron from "node-cron";
import fetch from "node-fetch"; // npm i node-fetch@2
import { AppDataSource } from "../config/database";
import { CallFrequencySetting } from "../entities/CallFrequencySetting";
import { CRMData } from "../entities/CRMData";
import { ScheduledCallHistory } from "../entities/ScheduledCallHistory";
import { CRMDataService, RetellTask } from "../services/CRMData.service";
import { CallOutputData } from "../entities/CallOutputData";
export class CallScheduler {
  // Track all scheduled cron jobs
  private static scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all active call frequency settings from DB
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
        const nowUTC = new Date(); // UTC timestamp
        console.log(`[${nowUTC.toISOString()}] Triggering calls for frequency ID ${id}`);

        const crmRepo = AppDataSource.getRepository(CRMData);
        const historyRepo = AppDataSource.getRepository(ScheduledCallHistory);
        const callDataRepo = AppDataSource.getRepository(CallOutputData);
        try {
          // Fetch only leads that still need to be called
          const leads = await crmRepo.find({ where: { need_to_call: true } });

          if (leads.length === 0) {
            console.log("No leads to call at this time.");
            return;
          }

          for (const lead of leads) {
            // Step 1: Call webhook first
            console.log(`Calling webhook for lead ${lead.lead_id}...`);
            let webhookData: any;

            try {
              const webhookResponse = await fetch("https://webhook.site/f7a7244b-700a-4bd2-861d-035937fd018c");
              webhookData = await webhookResponse.json();
              console.log("Webhook response:", webhookData);
            } catch (webhookError: any) {
              console.error(`❌ Webhook failed for lead ${lead.lead_id}:`, webhookError.message);

              // Save skipped history
              const skippedHistory = historyRepo.create({
                frequencySetting: { id } as CallFrequencySetting,
                executedAt: nowUTC,
                status: "skipped",
                webhookResponse: JSON.stringify({ error: webhookError.message }),
                errorMessage: "Webhook call failed",
              });
              await historyRepo.save(skippedHistory);
              continue; // Skip RetellAI call
            }

            // Step 2: Skip RetellAI if webhook result is false
            if (!webhookData?.result) {
              const skippedHistory = historyRepo.create({
                frequencySetting: { id } as CallFrequencySetting,
                executedAt: nowUTC,
                status: "skipped",
                webhookResponse: JSON.stringify(webhookData),
                errorMessage: "Webhook returned false",
              });
              await historyRepo.save(skippedHistory);
              console.warn(`Webhook returned false for lead ${lead.lead_id}. Skipping RetellAI.`);
              continue;
            }

            // Step 3: Call RetellAI only if webhook succeeds
            try {
              const task: RetellTask = {
                to_number: lead.mobile_number.startsWith("+") ? lead.mobile_number : `+${lead.mobile_number}`,
                retell_llm_dynamic_variables: {
                  name: lead.name || "",
                  lead_id: lead.lead_id || "",
                  unique_id: lead.unique_id || "",
                  greeting: `Hello ${lead.name || "there"}, this is a test call from Retell!`,
                },
              };

              const retellResponse = await CRMDataService.createBatchCall(task);

              // Save history after RetellAI call
              const historyRecord = historyRepo.create({
                frequencySetting: { id } as CallFrequencySetting,
                executedAt: nowUTC,
                status: retellResponse ? "success" : "failed",
                webhookResponse: JSON.stringify(webhookData),
                responseData: JSON.stringify(retellResponse),
                errorMessage: retellResponse ? undefined : "RetellAI call failed", // use undefined
              });
              await historyRepo.save(historyRecord);

              // Mark lead as called if successful
              // if (retellResponse) {
              //   lead.need_to_call = false;
              //   await crmRepo.save(lead);
              //   console.log(`Lead ${lead.lead_id} marked as called`);
              // }
              if (retellResponse) {
                const callData = await callDataRepo.findOne({
                  where: { lead_id: lead.lead_id }, // use actual entity column
                  order: { createdAt: "DESC" },
                });
                
                if (callData?.durationMs) {
                  lead.need_to_call = false;
                  await crmRepo.save(lead);
                  console.log(`Lead ${lead.lead_id} marked as called`);
                } else {
                  console.warn(
                    `Lead ${lead.lead_id} call not connected (status: ${callData?.disconnectionReason}), keeping need_to_call = true`
                  );
                }
              }

            } catch (retellError: any) {
              console.error(`RetellAI failed for lead ${lead.lead_id}:`, retellError.message);
              const historyRecord = historyRepo.create({
                frequencySetting: { id } as CallFrequencySetting,
                executedAt: nowUTC,
                status: "failed",
                webhookResponse: JSON.stringify(webhookData),
                errorMessage: retellError.message,
              });
              await historyRepo.save(historyRecord);
            }
          }

          console.log(`✅ Completed all leads for frequency ID ${id}`);
        } catch (error: any) {
          console.error("❌ Error fetching leads:", error.message);
        }
      },
      { timezone: "UTC" } //  Run cron in UTC
    );

    this.scheduledJobs.set(id, job);
    console.log(`Scheduled frequency ID ${id} with cron: ${cronExpression} (UTC)`);
  }

  static stopJob(id: string) {
    if (this.scheduledJobs.has(id)) {
      this.scheduledJobs.get(id)?.stop();
      this.scheduledJobs.delete(id);
      console.log(`Stopped scheduled job for frequency ID ${id}`);
    }
  }

  static stopAllJobs() {
    for (const [id, job] of this.scheduledJobs) {
      job.stop();
      console.log(`Stopped scheduled job for frequency ID ${id}`);
    }
    this.scheduledJobs.clear();
  }
}
