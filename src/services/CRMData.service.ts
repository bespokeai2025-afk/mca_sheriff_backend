import {
  errorWithData,
  errorWithoutData,
  successWithData,
  successWithoutData,
} from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { CRMData } from "../entities/CRMData";
import axios from "axios";
import { ILike } from "typeorm";
import { CallOutputData } from "../entities/CallOutputData";
import { BatchCalling } from "../entities/BatchCalling";
import { mapIncomingCRMData } from "../utils/mappercrm";
import { ExcelHistory } from "../entities/ExcelHistorySave";
import { PhoneNumber } from "../entities/PhoneNumberEntity";
import { AreaCount } from "../entities/AreaCount";
import { Between } from "typeorm";
import { AllCompanyNumbersAndAgents } from "../entities/All_Company_Numbers_and_Agents";
import { Admin } from "../entities/Admin";

import { lookup } from "dns";
import { generateTokens } from "../utils/jwtUtils"; // adjust path if needed
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export interface RetellTask {
  to_number: string;
  retell_llm_dynamic_variables?: {
    name?: string;
    client_name?: string;
    lead_id?: string;
    unique_id?: string;
    property_type?: string;
    property_type_address_line2?: string;
    property_type_address_line3?: string;
    available_slots?: string;
    city?: string;
    slot?: string | null; // ✅ can be string or null
    calendly_url?: string | null; // ✅ can be string or null
    greeting?: string;
    [key: string]: any;
  };
}
export class CRMDataService {
  // Repository for CMR Data database operations
  private CRMDataRepository = AppDataSource.getRepository(CRMData);
   private BatchRepository = AppDataSource.getRepository(BatchCalling);
   private AreaCountRepository = AppDataSource.getRepository(AreaCount);
private async getCalendlyAvailableSlot(daysAhead: number = 7): Promise<{ preferred_slot: { date: string; time: string }[] } | null> {
  try {
    const now = new Date();

    const formatCalendlyDate = (date: Date) => {
      const pad = (n: number, width = 2) => String(n).padStart(width, "0");
      return (
        `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
        `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.000000`
      );
    };

    const startTimeRaw = new Date(now.getTime() + 60 * 1000);
    const endTimeRaw = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const start_time = encodeURIComponent(formatCalendlyDate(startTimeRaw));
    const end_time = encodeURIComponent(formatCalendlyDate(endTimeRaw));

    const event_type = "https://api.calendly.com/event_types/6cc6e7d5-4efb-407b-a75d-78ba2905e02a";

    const url = `https://api.calendly.com/event_type_available_times?event_type=${encodeURIComponent(
      event_type
    )}&start_time=${start_time}&end_time=${end_time}`;

    const calendlyResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`,
      },
    });

    const collection = calendlyResponse.data.collection || [];
    if (collection.length === 0) return null;
// Filter available slots
    const availableSlots = collection
      .filter((slot: any) => slot.status === "available" && slot.scheduling_url)
      .map((slot: any) => {
        // const match = slot.scheduling_url.match(/\/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
        // if (!match) return null;
        // const [_, date, time] = match;
        // return { date, time };

         const match = slot.scheduling_url.match(/\/(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
        if (!match) return null;
        const [_, date, hoursStr, minutesStr] = match;

        let hours = parseInt(hoursStr, 10);
        const minutes = minutesStr;
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12; // convert 0 => 12
        const time = `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;

        return { date, time };
        
      })
      .filter(Boolean) as { date: string; time: string }[];

    if (availableSlots.length === 0) return null;

    return { preferred_slot: availableSlots };
  } catch (error: any) {
    console.error("❌ Error fetching Calendly slots:", error.response?.data || error.message);
    return null;
  }
}


//old logic batch call
// static async createBatchCall(tasks: RetellTask[]) {
//   if (tasks.length === 0) return null;

//   const payload = {
//     from_number: process.env.RETELL_FROM_NUMBER,
//     tasks: tasks,
//     trigger_timestamp:Date.now() + 60 * 1000, // current UTC time + 1 minute (in ms)
//     retell_llm_dynamic_variables: {
//       greeting: "Hello, this is a test call from Retell!",
//     },
//   };

//   try {
//     const response = await axios.post(
//       "https://api.retellai.com/create-batch-call",
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.API_KEY_RETELL}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log(" RetellAI response:", response.data);
//     return response.data;
//   } catch (error: any) {
//     if (error.response) {
//       console.error(" RetellAI API Error:", {
//         status: error.response.status,
//         data: error.response.data,
//       });
//     } else if (error.request) {
//       console.error(" No response received from RetellAI:", error.request);
//     } else {
//       console.error(" Error creating batch call:", error.message);
//     }
//     return null;
//   }
// }
  static async fetchRetellPhoneNumbers(): Promise<any[]> {
    try {
      const apiKey = process.env.API_KEY_RETELL;
      if (!apiKey) throw new Error("Missing Retell API key");

      const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };

     const response = await axios.get("https://api.retellai.com/list-phone-numbers", { headers });
 return response.data || [];


    } catch (error: any) {
      console.warn("Warning: Could not fetch phone numbers from RetellAI:", error.response?.data || error.message);
      return [];
    }
  }
  static async syncRetellAIandDB() {

    try {
      // Step 1️⃣: Fetch active phone numbers
      // const activeNumbers = await PhoneNumber.find({ where: { is_active: true } });
      const activeNumbers = await PhoneNumber.find({ where: { isActive: true } });

      console.log("📞 Active numbers in DB:", activeNumbers.map(n => n.phone_number));

      if (!activeNumbers.length) {
        console.warn("❌ No active phone numbers found in DB");
        return { result: false, message: "No active phone numbers found in DB" };
      }

      // Step 2️⃣: Fetch phone numbers from RetellAI
      const retellNumbers = await this.fetchRetellPhoneNumbers();
      console.log("📲 Retell numbers fetched:", retellNumbers.length);

      // Step 2.1️⃣: Collect unique agent_ids that need names
      const agentIdsToFetch = new Set<string>();
      for (const num of retellNumbers) {
        if (num.outbound_agent_id && !num.outbound_agent_name) {
          agentIdsToFetch.add(num.outbound_agent_id);
        }
      }

      // Step 2.2️⃣: Fetch agent names from RetellAI
      const agentNameMap = new Map<string, string>();
      await Promise.all(
        Array.from(agentIdsToFetch).map(async (agentId) => {
          try {
            const agentRes = await axios.get(`https://api.retellai.com/get-agent/${agentId}`, {
              headers: { Authorization: `Bearer ${process.env.API_KEY_RETELL}` },
            });
            const data = agentRes.data || {};
            const name = data.agent_name ?? data.name ?? data.agent?.agent_name ?? data.agent?.name ?? "Unknown Agent";
            agentNameMap.set(agentId, name);
          } catch (err: any) {
            console.warn(`Could not fetch agent ${agentId}:`, err.response?.status, err.message);
            agentNameMap.set(agentId, "Unknown Agent");
          }
        })
      );

      // Step 3️⃣: Sync outbound agent IDs only if changed
      const updatePayload: any[] = [];

      for (const dbNumber of activeNumbers) {
        const retellMatch = retellNumbers.find((r: any) => r.phone_number === dbNumber.phone_number);
        if (!retellMatch) continue;

        const outboundName = retellMatch.outbound_agent_id
          ? agentNameMap.get(retellMatch.outbound_agent_id) || null
          : null;

        const outboundChanged =
          dbNumber.outbound_agent_id !== retellMatch.outbound_agent_id ||
          (dbNumber.outbound_agent_name?.trim() || "") !== (outboundName?.trim() || "");

        if (outboundChanged) {
          console.log(`🔄 Updating phone number: ${dbNumber.phone_number}`);
          updatePayload.push({
            phone_number: dbNumber.phone_number,
            outbound_agent_id: retellMatch.outbound_agent_id,
            outbound_agent_name: outboundName,
            is_active: dbNumber.isActive,
          });
        }
      }

      // Step 4️⃣: Update DB directly
      for (const update of updatePayload) {
        await PhoneNumber.update(
          { phone_number: update.phone_number }, // ✅ criteria
          {
            outbound_agent_id: update.outbound_agent_id,
            outbound_agent_name: update.outbound_agent_name
          } // ✅ partial entity
        );
      }

      console.log("✅ Phone numbers updated directly in DB");
      return activeNumbers;
    } catch (error: any) {
      console.warn("Warning: Could not fetch phone numbers from RetellAI:", error.response?.data || error.message);
      return [];
    }
  }
  static async createBatchCall(task: RetellTask) {
    // 1️⃣ Sync RetellAI and DB
    const syncResult = await this.syncRetellAIandDB();

    if (!Array.isArray(syncResult)) {
      console.warn("❌ Sync failed:", syncResult.message);
      return { result: false, message: syncResult.message };
    }

    // ✅ Re-fetch active numbers to get the latest outbound agent info
    const activeNumbers = await PhoneNumber.find({ where: { isActive: true } });

    if (!activeNumbers || activeNumbers.length === 0) {
      console.warn("❌ No active numbers available after sync");
      return { result: false, message: "No active numbers available" };
    }


    const fromNumber = activeNumbers[0].phone_number;
    const outboundAgentId = activeNumbers[0].outbound_agent_id;
    const outboundAgentName = activeNumbers[0].outbound_agent_name;

    // 2️⃣ Validate company and phone number mapping
    const companyId = process.env.COMPANY_ID;
    if (!companyId) {
      console.error("❌ COMPANY_ID not set in environment variables!");
      return { result: false, message: "Missing COMPANY_ID in environment" };
    }

    // 3️⃣ Fetch all company mappings
    const allCompanies = await AllCompanyNumbersAndAgents.find();

    if (!allCompanies || allCompanies.length === 0) {
      console.warn("❌ No company records found in All_Company_Numbers_and_Agents");
      return { result: false, message: "No company data found. Contact to Admin" };
    }

    // 4️⃣ Compare each phone_number in company arrays with activeNumbers
    let matchedNumbers: {
      phone_number: string;
      outbound_agent_id: string;
      outbound_agent_name: string;
      matched: boolean;
    }[] = [];

    for (const company of allCompanies) {
      const { phone_number: phoneArr, outbound_agent_id: agentIdArr, outbound_agent_name: agentNameArr } = company;

      for (let i = 0; i < phoneArr.length; i++) {
        const phone = phoneArr[i];
        const agentId = agentIdArr[i];
        const agentName = agentNameArr[i].trim();

        // Check if this triplet exists in phone_numbers table
        const match = activeNumbers.find(
          n =>
            n.phone_number === phone &&
            n.outbound_agent_id === agentId &&
            n.outbound_agent_name.trim() === agentName
        );

        matchedNumbers.push({
          phone_number: phone,
          outbound_agent_id: agentId,
          outbound_agent_name: agentName,
          matched: !!match,
        });
      }
    }

    // ✅ Check if at least one number matched
    const matchFound = matchedNumbers.some(n => n.matched);
    if (!matchFound) {
      console.warn("🚫 No matching agent found in All_Company_Numbers_and_Agents");
      return { result: false, message: "Calling Agent not matched. Contact to Admin", data: matchedNumbers };
    }

    console.log("✅ At least one number matched in company arrays", matchedNumbers.filter(n => n.matched));


    //  Proceed only if validation passes
    const apiKey = process.env.API_KEY_RETELL;
    if (!apiKey) {
      console.error("❌ Missing API_KEY_RETELL in environment variables!");
      return { result: false, message: "Missing API_KEY_RETELL" };
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    

    const payload = {
      from_number: fromNumber,
      to_number: task.to_number,
      retell_llm_dynamic_variables: task.retell_llm_dynamic_variables,
      trigger_timestamp: Date.now() + 60 * 1000, // 1 minute later
    };

    try {
      const response = await axios.post(
        "https://api.retellai.com/v2/create-phone-call",
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.API_KEY_RETELL}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📞 RetellAI call created:", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error("❌ RetellAI API Error:", {
          status: error.response.status,
          data: error.response.data,
        });
      } else if (error.request) {
        console.error("⚠️ No response from RetellAI:", error.request);
      } else {
        console.error("💥 Error creating Retell call:", error.message);
      }
      return null;
    }

  }
 private async getBatchCallRecords(verifyUser: any, batchLimit: number) {

  //  Fetch current day's allowed call count from AreaCount
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const crmWhere: any = { need_to_call: true, isDeleted: false };
  if (verifyUser.user_exist) crmWhere.isActive = true;

  // 1️⃣ Fetch CRM data
  const crmDataList = await this.CRMDataRepository.find({
    where: crmWhere,
    order: { createdAt: "DESC" },
  });

  if (!crmDataList.length) return [];
  // Sync CRM data with BatchCalling table
  for (const crm of crmDataList) {
    // Skip if invalid or undefined lead_id
    if (!crm.lead_id || crm.lead_id === "undefined") {
      console.warn(" Skipping CRM record with invalid lead_id:", crm.lead_id);
      continue;
    }

    // Find existing batch call record by lead_id
    const existing = await this.BatchRepository.findOne({ where: { lead_id: crm.lead_id } });

    if (existing) {
      // Update existing record
      existing.mobile_number = crm.mobile_number;
      existing.name = crm.name;
      existing.need_to_call = true;
      existing.send_to_retail = false;
      existing.call_status = "pending";
      await this.BatchRepository.save(existing);
    } else {
      // Create new batch record
      const newCall = this.BatchRepository.create({
        lead_id: crm.lead_id,
        mobile_number: crm.mobile_number,
        name: crm.name,
        need_to_call: true,
        send_to_retail: false,
        call_status: "pending",
      });
      await this.BatchRepository.save(newCall);
    }
  }
  const areaCount = await this.AreaCountRepository.findOne({
    where: {
      isActive: true,
      updatedAt: Between(startOfDay, endOfDay),
    },
  });
 // If no record found, fallback to batchLimit
  const allowedCalls = areaCount ? areaCount.count : batchLimit;

  //  Fetch today's call count already made
  const todayCallsCount = await this.BatchRepository.count({
    where: {
      call_status: "completed",
      need_to_call: false,
      send_to_retail: true,
      updatedAt: Between(startOfDay, endOfDay),
    },
  });

  // Calculate remaining calls allowed today
  const remainingCalls = Math.max(allowedCalls - todayCallsCount, 0);

  if (remainingCalls === 0) {
    console.log("Daily call limit reached.");
    return [];
  }
 // Fetch all batch records ready for calling
  const takeCount = Math.min(batchLimit, remainingCalls)

  //  Fetch all batch records ready for calling
  const batchRecords = await this.BatchRepository.find({
    where: { need_to_call: true, send_to_retail: false, call_status: "pending" },
    // take: batchLimit,
    take: takeCount,
    order: { createdAt: "ASC" },
  });

  return batchRecords;
}
private async startBatchCalls(batchRecords: any[], calendlySlots: any) {
  const callResults: any[] = [];

  for (const batch of batchRecords) {
    const crm = await this.CRMDataRepository.findOne({ where: { lead_id: batch.lead_id } });
    if (!crm) continue;

    const task = {
      to_number: batch.mobile_number,
      retell_llm_dynamic_variables: {
        name: crm.name ?? "",
        client_name: crm.client_name ?? "",
        lead_id: String(crm.lead_id),
        unique_id: crm.unique_id ?? "",
        property_type: crm.property_type ?? "",
        property_address_line2: crm.new_propinfo_street2 ?? "",
        property_address_line3: crm.address1_line2 ?? "",
        city: crm.new_propinfo_city ?? "",
        available_slots: JSON.stringify(calendlySlots),
        greeting: `Hello ${crm.name ?? ""}, this is a test call from Retell!`,
      },
    };
    //  Call RetellAI
    const retellResponse = await CRMDataService.createBatchCall(task);
    // 4️⃣ Push to results
    callResults.push({
      lead_id: crm.lead_id,
      to_number: batch.mobile_number,
      retellResponse,
    });

    // 5️⃣ Small delay between calls
    await sleep(1000);
  }

  return callResults;
}
 public async getCRMData(verifyUser: any, batchLimit: number = Number(process.env.BATCH_LIMIT || 5)) {
  try {
    console.log(" Starting getCRMData() process...");

    //  Fetch Calendly slots (for RetellAI dynamic variable)
    const calendlySlots = await this.getCalendlyAvailableSlot();

    //  Get batch call records (CRM data synced into BatchCalling)
    const batchRecords = await this.getBatchCallRecords(verifyUser, batchLimit);
    console.log(" Batch records fetched:", batchRecords?.length || 0);

    if (!batchRecords.length) {
      console.log(" No leads found for batch calling");
      return successWithoutData("No CRM data available for calling");
    }

    //  Start batch calls using RetellAI
    const callResults = await this.startBatchCalls(batchRecords, calendlySlots);
    console.log(" Batch calls completed:", callResults?.length || 0);

    // Attach Retell call responses with CRM data for response
    const enrichedData = await Promise.all(
      callResults.map(async (result: any) => {
        const crm = await this.CRMDataRepository.findOne({
          where: { lead_id: result.lead_id },
        });
        return {
          ...crm,
          retellResponse: result.retellResponse || null,
        };
      })
    );

    // 5️⃣ Final success response
    return successWithData("CRM data and call results processed successfully", enrichedData);
  } catch (error: any) {
    console.error(" Error in getCRMData:", error.message);
    return errorWithData("Something went wrong while fetching CRM data", error);
  }
}
//  public async getCRMData(
//   verifyUser: any,
//   batchLimit: number = 1 // default batch size
// ) {
//   try {
//     const allProcessedData: any[] = [];

//     // 1️⃣ Fetch available Calendly slots once
//     const calendlySlots = await this.getCalendlyAvailableSlot();

//     while (true) {
//       // 2️⃣ Fetch CRM records that need to be called
//       const crmWhere: any = { need_to_call: true, isDeleted: false };
//       if (verifyUser.user_exist) crmWhere.isActive = true;

//       const crmDataList = await this.CRMDataRepository.find({
//         where: crmWhere,
//         order: { createdAt: "DESC" },
//       });

//       if (!crmDataList.length) break; // No more CRM records

//       // 3️⃣ Insert/update records in BatchCalling table
//       for (const crm of crmDataList) {
//         if (!crm.lead_id) continue;

//         const existing = await this.BatchRepository.findOne({ where: { lead_id: crm.lead_id } });
//         if (existing) {
//           existing.mobile_number = crm.mobile_number;
//           existing.name = crm.name;
//           existing.need_to_call = true;
//           existing.send_to_retail = false;
//           await this.BatchRepository.save(existing);
//         } else {
//           const newCall = this.BatchRepository.create({
//             lead_id: crm.lead_id,
//             mobile_number: crm.mobile_number,
//             name: crm.name,
//             need_to_call: true,
//             send_to_retail: false,
//           });
//           await this.BatchRepository.save(newCall);
//         }
//       }

//       // 4️⃣ Fetch batch records ready to call (limited by batchLimit)
//       const batchRecords = await this.BatchRepository.find({
//         where: { need_to_call: true },
//         take: batchLimit,
//         order: { createdAt: "ASC" },
//       });

//       if (!batchRecords.length) break; // No more batch records

//       // 5️⃣ Map RetellAI tasks
//       const tasks: RetellTask[] = batchRecords
//         .map((batch) => {
//           const crm = crmDataList.find((c) => c.lead_id === batch.lead_id);
//           if (!crm) return null;

//           return {
//             to_number: batch.mobile_number,
//             retell_llm_dynamic_variables: {
//               name: crm.name ?? "",
//               client_name: crm.client_name ?? "",
//               lead_id: String(crm.lead_id),
//               unique_id: crm.unique_id ?? "",
//               property_type: crm.property_type ?? "",
//               property_address_line2: crm.new_propinfo_street2 ?? "",
//               property_address_line3: crm.address1_line2 ?? "",
//               city: crm.new_propinfo_city ?? "",
//               available_slots: JSON.stringify(calendlySlots),
//               greeting: `Hello ${crm.name ?? ""}, this is a test call from Retell!`,
//             },
//           };
//         })
//         .filter(Boolean) as RetellTask[];

//       // 6️⃣ Call RetellAI sequentially
//       const callResults: any[] = [];
//       for (const task of tasks) {
//         if (!task.retell_llm_dynamic_variables) continue;

//         const retellResponse = await CRMDataService.createBatchCall(task);

//         callResults.push({
//           lead_id: task.retell_llm_dynamic_variables.lead_id,
//           to_number: task.to_number,
//           retellResponse,
//         });

//         await sleep(1000); // small delay between calls
//       }

//       // 7️⃣ Update only completed or ended calls with valid duration
//       // for (const result of callResults) {
//       //   const retell = result.retellResponse;
//       //   const isCallEnded = retell?.status == "ended";
//       //   const durationMs = retell?.duration_ms ! =="null";

//       //   if (!isCallEnded || durationMs == null) continue;

//       //   // Update BatchCalling table
//       //   const batchCall = await this.BatchRepository.findOne({ where: { lead_id: result.lead_id } });
//       //   if (batchCall) {
//       //     batchCall.need_to_call = false;
//       //     batchCall.send_to_retail = true;
//       //     await this.BatchRepository.save(batchCall);
//       //   }

//       //   // Update CRMData table
//       //   const crmRecord = await this.CRMDataRepository.findOne({ where: { lead_id: result.lead_id } });
//       //   if (crmRecord) {
//       //     crmRecord.need_to_call = false;
//       //     await this.CRMDataRepository.save(crmRecord);
//       //   }

//       //   // Insert/Update CallOutputData
//       //   if (batchCall && crmRecord) {
//       //     await AppDataSource.getRepository(CallOutputData).save({
//       //       crmData: crmRecord,
//       //       batchCallId: batchCall.id,
//       //       duration_ms: durationMs,
//       //       call_status: retell.status,
//       //       to_number: result.to_number,
//       //       raw_response: retell,
//       //     });
//       //   }
//       // }
// for (const task of tasks) {
//   const retellResponse = await CRMDataService.createBatchCall(task);

//   // Update batch record immediately after call
//   const batchCall = await this.BatchRepository.findOne({ where: { lead_id: task.retell_llm_dynamic_variables?.lead_id } });
//   if (batchCall) {
//     batchCall.need_to_call = false;
//     batchCall.send_to_retail = true;
//     await this.BatchRepository.save(batchCall);
//   }

//   // Update CRMData
//   const crmRecord = await this.CRMDataRepository.findOne({ where: { lead_id: task.retell_llm_dynamic_variables?.lead_id } });
//   if (crmRecord) {
//     crmRecord.need_to_call = false;
//     await this.CRMDataRepository.save(crmRecord);
//   }
// }

//       // 8️⃣ Collect processed data for this batch
//       const enrichedCRMData = crmDataList.map((crm) => {
//         const response = callResults.find((r) => r.lead_id === String(crm.lead_id));
//         return { ...crm, retellResponse: response?.retellResponse || null };
//       });

//       allProcessedData.push(...enrichedCRMData);
//     }

//     return successWithData("✅ All CRM batches processed successfully", allProcessedData);
//   } catch (error: any) {
//     console.error("Error in getCRMData:", error.message);
//     return errorWithData("Something went wrong", error);
//   }
// }

  // public async getCRMData(verifyUser: any) {
  //   try {
  //     // 1️⃣ Fetch Calendly slots
  //     const calendlySlots = await this.getCalendlyAvailableSlot();
  //     console.log("calendlySlots",calendlySlots)

  //     // 2️⃣ Build dynamic where condition
  //     let whereCondition = {};
  //     if (verifyUser.user_exist) {
  //       whereCondition = {
  //         isActive: true,
  //         isDeleted: false,
  //         need_to_call: true,
  //       };
  //     }
  //     if (verifyUser.admin_exist) {
  //       whereCondition = { isDeleted: false, need_to_call: true };
  //     }

  //     // 3️⃣ Fetch all CRM data (no pagination)
  //     const mainCategories = await this.CRMDataRepository.find({
  //       where: whereCondition,
  //       order: { createdAt: "DESC" },
  //     });

      


      
  //     // 4️⃣ Prepare tasks for RetellAI
  //     const tasks: RetellTask[] = mainCategories
  //       .filter((crm: any) => crm.mobile_number && crm.need_to_call)
  //       .map((crm: any, index: number) => {
  //       // const selectedSlot =
  //       //   calendlySlots.length > 0
  //       //     ? calendlySlots[index % calendlySlots.length]
  //       //     : null;

  //       return {
  //           to_number: crm.mobile_number,
  //           retell_llm_dynamic_variables: {
  //             name: crm.name ?? "",
  //             client_name: crm.client_name ?? "",
  //             lead_id: crm.lead_id ? String(crm.lead_id) : "",
  //             unique_id: crm.unique_id ? String(crm.unique_id) : "",
  //             property_type: crm.property_type ?? "",
  //             property_address_line2: crm.new_propinfo_street2 ?? "",
  //             property_address_line3: crm.address1_line2 ?? "",
  //             available_slots: JSON.stringify(calendlySlots), // now allowed
  //             city: crm.new_propinfo_city ?? "",
  //             greeting: `Hello ${crm.name ?? ""}, this is a test call from Retell!`,
  //           },
  //         };
  //       });

  //     // 5️⃣ Call RetellAI API one by one using for loop with 1-second delay
  //     const callResults: any[] = [];
  //     for (const task of tasks) {
  //       const retellResponse = await CRMDataService.createBatchCall(task);
  //       callResults.push({ to_number: task.to_number, retellResponse });

  //       // 1-second delay between calls
  //       await sleep(1000);
  //     }

  //     // 6️⃣ Attach responses and Calendly slot to each CRM record
  //     const enrichedCategories = mainCategories.map((crm: any, index: number) => {
  //       const response = callResults.find((r) => r.to_number === crm.mobile_number);
  //       return {
  //         ...crm,
  //         retellResponse: response?.retellResponse || null,
  //       };
  //     });

  //     // 7️⃣ Return final result
  //     return successWithData("CRM data", enrichedCategories);
  //   } catch (error: any) {
  //     console.error("Error fetching CRM data:", error.message);
  //     return errorWithData("Something went wrong", error);
  //   }
  // }  
  public async getUsercrmData(
    verifyUser: any,
    mobile_number?: string // optional
  ) {
    try {
      let whereCondition: any = {};

      if (verifyUser.user_exist) {
        whereCondition = { isActive: true, isDeleted: false };
      }
      if (verifyUser.admin_exist) {
        whereCondition = { isDeleted: false };
      }

      if (mobile_number) {
        whereCondition.mobile_number = ILike(
          `%${mobile_number.replace(/\s+/g, "")}%`
        );
      }

      const crmData = await this.CRMDataRepository.find({
        where: whereCondition,
        order: { createdAt: "DESC" },
      });

      // Return only name and mobile_number
      const simplifiedData = crmData.map((item) => ({
        name: item.name,
        mobile_number: item.mobile_number,
      }));

      return successWithData(
        "User CRM data fetched successfully!",
        simplifiedData
      );
    } catch (error) {
      return errorWithData("Something went wrong", { error });
    }
  }
  public async createCRMData(Data: object, verifyUser: any) {
    try {
      // Only admin allowed
      if (verifyUser?.user_exist) {
        return errorWithoutData("Only admin can create CRM Data");
      }

      // Create CRM entity instance
      const newCRMData = this.CRMDataRepository.create(Data);

      // Save to DB
      const crmdataoutput = await this.CRMDataRepository.save(newCRMData);

      if (!crmdataoutput) {
        return errorWithoutData("CRM Data not created");
      }

      return successWithData("CRM data created successfully", crmdataoutput);
    } catch (error) {
      return errorWithoutData(
        "Error creating CRM Data: " + (error as Error).message
      );
    }
  }
  // public async createCRMDataWithoutAuth(DataArray: object[]) {
  //   try {
  //     const insertedRecords: any[] = [];
  //     const skippedLeadIds: string[] = [];

  //     for (const rawData of DataArray) {
  //       const mappedData = mapIncomingCRMData(rawData);

  //       const existingRecord = await this.CRMDataRepository.findOne({
  //         where: { lead_id: mappedData.lead_id },
  //       });

  //       if (existingRecord) {
  //         skippedLeadIds.push(mappedData.lead_id);
  //         console.log(`Skipping existing lead_id: ${mappedData.lead_id}`);
  //         continue;
  //       }

  //       const newCRMData = this.CRMDataRepository.create(mappedData);
  //       const savedRecord = await this.CRMDataRepository.save(newCRMData);
  //       insertedRecords.push(savedRecord);

  //       const callOutputRepository =
  //         AppDataSource.getRepository(CallOutputData);
  //       const callOutput = callOutputRepository.create({
  //         crmData: savedRecord,
  //         name: savedRecord.name,
  //         toNumber: savedRecord.mobile_number,
  //         lead_id: savedRecord.lead_id,
  //         callStatus: "net_to_call",
  //       });
  //       await callOutputRepository.save(callOutput);
  //     }

  //     // Always return result: true
  //     return {
  //       result: true,
  //       statuscode: 200,
  //       message:
  //         insertedRecords.length > 0
  //           ? "CRM data created successfully"
  //           : "No new CRM data created (all lead_id already exist)",
  //       data: {
  //         insertedRecords,
  //         skippedLeadIds,
  //       },
  //     };
  //   } catch (error) {
  //     console.error("Error creating CRM data:", error);
  //     return errorWithData("Something went wrong", error);
  //   }
  // }
  public async createCRMDataWithoutAuth(DataArray: object[]) {
    try {
      const insertedRecords: any[] = [];
      const updatedRecords: any[] = [];
      const failedRecords: any[] = [];

      const callOutputRepository = AppDataSource.getRepository(CallOutputData);

      for (const rawData of DataArray) {
        try {
          const mappedData = mapIncomingCRMData(rawData);

          // Check if lead_id already exists
          const existingRecord = await this.CRMDataRepository.findOne({
            where: { lead_id: mappedData.lead_id },
          });

          if (existingRecord) {
            // ✅ Update existing record
            await this.CRMDataRepository.update(existingRecord.id, mappedData);
            const updatedRecord = await this.CRMDataRepository.findOne({
              where: { id: existingRecord.id },
            });
            if (updatedRecord) updatedRecords.push(updatedRecord);
            console.log(`Updated existing lead_id: ${mappedData.lead_id}`);
          } else {
            // ✅ Insert new record
            const newCRMData = this.CRMDataRepository.create(mappedData);
            const savedRecord = await this.CRMDataRepository.save(newCRMData);
            insertedRecords.push(savedRecord);

            // Create call output entry
            const callOutput = callOutputRepository.create({
              crmData: savedRecord,
              name: savedRecord.name,
              toNumber: savedRecord.mobile_number,
              lead_id: savedRecord.lead_id,
              callStatus: "need_to_call",
              // new_propinfo_street2: savedRecord.new_propinfo_street2
            });
            await callOutputRepository.save(callOutput);
          }
        } catch (innerError: unknown) {
          // ✅ Safely handle unknown error type
          const errorMessage =
            innerError instanceof Error
              ? innerError.message
              : String(innerError);
          console.error("Error processing record:", errorMessage);
          failedRecords.push({ rawData, error: errorMessage });
        }
      }

      return {
        result: true,
        statuscode: 200,
        message: `CRM data processed successfully`,
        data: {
          insertedCount: insertedRecords.length,
          updatedCount: updatedRecords.length,
          failedCount: failedRecords.length,
          insertedRecords,
          updatedRecords,
          failedRecords,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error creating/updating CRM data:", errorMessage);
      return errorWithData("Something went wrong", errorMessage);
    }
  }
  // public static async uploadCRMCSVFile(dataArray: any[], fileName: string) {
  //   const crmRepository = AppDataSource.getRepository(CRMData);
  //   const callOutputRepository = AppDataSource.getRepository(CallOutputData);
  //   const historyRepository = AppDataSource.getRepository(ExcelHistory);

  //   const insertedRecords: CRMData[] = [];
  //   const updatedRecords: CRMData[] = [];
  //   const failedRecords: any[] = [];

  //   let failCount = 0;

  //   for (const item of dataArray) {
  //     try {
  //       const now = new Date();
  //       const email = (item.emailaddress1 || "").toLowerCase();
  //       const mobile = item.mobilephone || "";

  //       // Skip empty rows
  //       if (!email && !mobile) {
  //         failCount++;
  //         continue;
  //       }

  //       // Generate leadId if not provided
  //       const timestampPart = `${now.getFullYear()}${(now.getMonth() + 1)
  //         .toString()
  //         .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}${now
  //           .getHours()
  //           .toString()
  //           .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now
  //             .getSeconds()
  //             .toString()
  //             .padStart(2, "0")}${now
  //               .getMilliseconds()
  //               .toString()
  //               .padStart(3, "0")}`;

  //       const leadId = item.leadid || `${timestampPart}`;

  //       // Check if lead_id already exists
  //       const existingRecord = await crmRepository.findOne({
  //         where: { lead_id: leadId },
  //       });

  //       if (existingRecord) {
  //         // ✅ Update existing record
  //         const updatedData = mapIncomingCRMData({
  //           ...existingRecord,
  //           ...item,
  //           email,
  //           mobile_number: mobile,
  //         });

  //         await crmRepository.update(existingRecord.id, updatedData);

  //         const updatedRecord = await crmRepository.findOne({
  //           where: { id: existingRecord.id },
  //         });

  //         if (updatedRecord) updatedRecords.push(updatedRecord);
  //         console.log(`Updated existing lead_id: ${leadId}`);
  //       } else {
  //         // ✅ Insert new record
  //         const mappedData = mapIncomingCRMData({
  //           ...item,
  //           email,
  //           mobile_number: mobile,
  //           lead_id: leadId,
  //           unique_id: leadId,
  //         });

  //         const savedRecord = await crmRepository.save(
  //           crmRepository.create(mappedData)
  //         );
  //         insertedRecords.push(savedRecord);

  //         // Create CallOutputData for each new CRM record
  //         const callOutput = callOutputRepository.create({
  //           crmData: savedRecord,
  //           name: savedRecord.name,
  //           toNumber: savedRecord.mobile_number,
  //           lead_id: savedRecord.lead_id,
  //           callStatus: "need_to_call",
  //         });
  //         await callOutputRepository.save(callOutput);

  //         console.log(`Inserted new lead_id: ${leadId}`);
  //       }
  //     } catch (error: unknown) {
  //       const errMsg = error instanceof Error ? error.message : String(error);
  //       failedRecords.push({ item, error: errMsg });
  //       failCount++;
  //       console.error("Error processing record:", errMsg);
  //     }
  //   }

  //   // Save Excel history (link to first CRM record if available)
  //   const firstRecord = insertedRecords[0] || updatedRecords[0];
  //   const historyRecord = historyRepository.create({
  //     file_name: fileName,
  //     fail_count: failCount,
  //     correct_count: insertedRecords.length + updatedRecords.length,
  //     lead_id: firstRecord?.lead_id,
  //     crm_data: firstRecord,
  //   });
  //   await historyRepository.save(historyRecord);

  //   return {
  //     result: true,
  //     statuscode: 200,
  //     message: "CRM data processed successfully",
  //     data: {
  //       insertedCount: insertedRecords.length,
  //       updatedCount: updatedRecords.length,
  //       failedCount: failCount,
  //       insertedRecords,
  //       updatedRecords,
  //       failedRecords,
  //     },
  //   };
  // }

  public static async uploadCRMCSVFile(dataArray: any[], fileName: string) {
    const crmRepository = AppDataSource.getRepository(CRMData);
    const callOutputRepository = AppDataSource.getRepository(CallOutputData);
    const historyRepository = AppDataSource.getRepository(ExcelHistory);

    const insertedRecords: CRMData[] = [];
    const updatedRecords: CRMData[] = [];
    const failedRecords: any[] = [];

    let failCount = 0;

    for (const item of dataArray) {
      try {
        const now = new Date();
        const email = (item.emailaddress1 || "").toLowerCase();

        //  Normalize mobile
        let mobile = String(item.mobilephone ?? "").trim();
        if (mobile && !mobile.startsWith("+")) {
          mobile = `+${mobile}`;
        }

        // Skip empty rows
        if (!email && !mobile) {
          failCount++;
          continue;
        }

        // Generate unique lead ID
        const timestampPart = `${now.getFullYear()}${(now.getMonth() + 1)
          .toString()
          .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}${now
            .getHours()
            .toString()
            .padStart(2, "0")}${now.getMinutes().toString()
              .padStart(2, "0")}${now.getSeconds().toString()
                .padStart(2, "0")}${now.getMilliseconds().toString().padStart(3, "0")}`;

        const leadId = item.leadid || `${timestampPart}`;

        const existingRecord = await crmRepository.findOne({ where: { lead_id: leadId } });

        if (existingRecord) {
          // Update
          const updatedData = mapIncomingCRMData({
            ...existingRecord,
            ...item,
            email,
            mobile_number: mobile, // string with '+'
          });

          await crmRepository.update(existingRecord.id, updatedData);
          const updatedRecord = await crmRepository.findOne({ where: { id: existingRecord.id } });
          if (updatedRecord) updatedRecords.push(updatedRecord);

          console.log(`Updated existing lead_id: ${leadId}`);
        } else {
          // Insert
          const mappedData = mapIncomingCRMData({
            ...item,
            email,
            mobile_number: mobile, // string with '+'
            lead_id: leadId,
            unique_id: leadId,
          });

          const savedRecord = await crmRepository.save(crmRepository.create(mappedData));
          insertedRecords.push(savedRecord);

          // Create CallOutputData
          const callOutput = callOutputRepository.create({
            crmData: savedRecord,
            name: savedRecord.name,
            toNumber: savedRecord.mobile_number,
            lead_id: savedRecord.lead_id,
            callStatus: "need_to_call",
          });
          await callOutputRepository.save(callOutput);

          console.log(`Inserted new lead_id: ${leadId}`);
        }
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        failedRecords.push({ item, error: errMsg });
        failCount++;
        console.error("Error processing record:", errMsg);
      }
    }

    // Save Excel history
    const firstRecord = insertedRecords[0] || updatedRecords[0];
    if (firstRecord) {
      const historyRecord = historyRepository.create({
        file_name: fileName,
        fail_count: failCount,
        correct_count: insertedRecords.length + updatedRecords.length,
        lead_id: firstRecord.lead_id,
        crm_data: firstRecord,
      });
      await historyRepository.save(historyRecord);
    }

    return {
      result: true,
      statuscode: 200,
      message: "CRM data processed successfully",
      data: {
        insertedCount: insertedRecords.length,
        updatedCount: updatedRecords.length,
        failedCount: failCount,
        insertedRecords,
        updatedRecords,
        failedRecords,
      },
    };
  }
}
