import {
  errorWithData,
  errorWithoutData,
  successWithData,
  successWithoutData,
} from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { CRMData } from "../entities/CRMData";
import axios from "axios";
import { ILike } from "typeorm";
import { CallOutputData } from "../entities/CallOutputData";
import { mapIncomingCRMData } from "../utils/mappercrm";
import { ExcelHistory } from "../entities/ExcelHistorySave";
import { PhoneNumber } from "../entities/PhoneNumberEntity";
import { AllCompanyNumbersAndAgents } from "../entities/All_Company_Numbers_and_Agents";
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
    // available_slot?: { 
    //   preferred_slot: { 
    //     date: string; 
    //     time: string; 
    //   } 
    // } | null; // <- object type now allowed
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

  // ✅ Fetch available Calendly slot before starting call
  // private async getCalendlyAvailableSlot(
  //   daysAhead: number = 7
  // ): Promise<string[]> {
  //   try {
  //     // const now = new Date();
  //     // const start_time = now.toISOString(); // current UTC time
  //     // const end_time = new Date(
  //     //   now.getTime() + daysAhead * 24 * 60 * 60 * 1000
  //     // ).toISOString(); // X days ahead

  //      // Convert to Calendly’s expected format: "YYYY-MM-DD HH:mm:ss.SSSSSS"
  //       const now = new Date();
  //       const formatCalendlyDate = (date: Date) => {
  //     const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  //     return (
  //       `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
  //       `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.000000`
  //     );
  //   };

  //   const start_time = formatCalendlyDate(now);
  //   const end_time = formatCalendlyDate(
  //     new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  //   );

  //     console.log("Calendly Start Time:", start_time);
  //     console.log("Calendly End Time:", end_time);

  //     const event_type =
  //       "https://api.calendly.com/event_types/6cc6e7d5-4efb-407b-a75d-78ba2905e02a";

  //     const calendlyResponse = await axios.get(
  //       "https://api.calendly.com/event_type_available_times",
  //       {
  //         headers: {
  //           Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`,
  //         },
  //         params: { start_time, end_time, event_type },
  //       }
  //     );

  //     const collection = calendlyResponse.data.collection || [];
  //     if (collection.length === 0) {
  //       console.warn("⚠️ No available Calendly slots found");
  //       return []; // ✅ return empty array, not null
  //     }

  //     // Return all scheduling URLs as array
  //     const slots = collection
  //       .filter(
  //         (slot: any) => slot.status === "available" && slot.scheduling_url
  //       )
  //       .map((slot: any) => slot.scheduling_url);

  //     return slots.length > 0 ? slots : [];
  //   } catch (error: any) {
  //     console.error("❌ Error fetching Calendly slots:", error.message);
  //     return []; // ✅ fallback empty array on error
  //   }
  // }

// private async getCalendlyAvailableSlot(daysAhead: number = 7): Promise<string[]> {
//   try {
//     const now = new Date();

//     // Helper: format date to Calendly's expected format
//     const formatCalendlyDate = (date: Date) => {
//       const pad = (n: number, width = 2) => String(n).padStart(width, "0");
//       return (
//         `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
//         `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.000000`
//       );
//     };

//     // Add a 1-minute buffer for start_time
//     const startTimeRaw = new Date(now.getTime() + 60 * 1000);
//     const endTimeRaw = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

//     const start_time = formatCalendlyDate(startTimeRaw);
//     const end_time = formatCalendlyDate(endTimeRaw);

//     const encodedStart = encodeURIComponent(start_time);
//     const encodedEnd = encodeURIComponent(end_time);

//     const event_type =
//       "https://api.calendly.com/event_types/6cc6e7d5-4efb-407b-a75d-78ba2905e02a";

//     const url = `https://api.calendly.com/event_type_available_times?event_type=${encodeURIComponent(
//       event_type
//     )}&start_time=${encodedStart}&end_time=${encodedEnd}`;

//     console.log("🌐 Calendly API URL:", url);

//     const calendlyResponse = await axios.get(url, {
//       headers: {
//         Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`,
//       },
//     });

//     const collection = calendlyResponse.data.collection || [];

//     if (collection.length === 0) {
//       console.warn("⚠️ No available Calendly slots found");
//       return [];
//     }

//     // ✅ Extract full list of available slot URLs
//     const slots = collection
//       .filter((slot: any) => slot.status === "available" && slot.scheduling_url)
//       .map((slot: any) => slot.scheduling_url);

//     console.log("✅ Found available Calendly slots:", slots);
//     return slots;
//   } catch (error: any) {
//     console.error(
//       "❌ Error fetching Calendly slots:",
//       error.response?.data || error.message
//     );
//     return [];
//   }
// }


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
        const match = slot.scheduling_url.match(/\/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
        if (!match) return null;
        const [_, date, time] = match;
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
      const activeNumbers = await PhoneNumber.find({ where: { is_active: true } });
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
            is_active: dbNumber.is_active,
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
    const activeNumbers = await PhoneNumber.find({ where: { is_active: true } });

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

  public async getCRMData(verifyUser: any) {
    try {
      // 1️⃣ Fetch Calendly slots
      const calendlySlots = await this.getCalendlyAvailableSlot();
      console.log("calendlySlots",calendlySlots)

      // 2️⃣ Build dynamic where condition
      let whereCondition = {};
      if (verifyUser.user_exist) {
        whereCondition = {
          isActive: true,
          isDeleted: false,
          need_to_call: true,
        };
      }
      if (verifyUser.admin_exist) {
        whereCondition = { isDeleted: false, need_to_call: true };
      }

      // 3️⃣ Fetch all CRM data (no pagination)
      const mainCategories = await this.CRMDataRepository.find({
        where: whereCondition,
        order: { createdAt: "DESC" },
      });

      


      
      // 4️⃣ Prepare tasks for RetellAI
      const tasks: RetellTask[] = mainCategories
        .filter((crm: any) => crm.mobile_number && crm.need_to_call)
        .map((crm: any, index: number) => {
        // const selectedSlot =
        //   calendlySlots.length > 0
        //     ? calendlySlots[index % calendlySlots.length]
        //     : null;


        

          return {
            to_number: crm.mobile_number,
            retell_llm_dynamic_variables: {
              name: crm.name ?? "",
              client_name: crm.client_name ?? "",
              lead_id: crm.lead_id ? String(crm.lead_id) : "",
              unique_id: crm.unique_id ? String(crm.unique_id) : "",
              property_type: crm.property_type ?? "",
              property_type_address_line2: crm.property_type_address_line2 ?? "",
              property_type_address_line3: crm.property_type_address_line3 ?? "",
              available_slots: JSON.stringify(calendlySlots), // now allowed
              city: crm.city ?? "",
              greeting: `Hello ${crm.name ?? ""}, this is a test call from Retell!`,
            },
          };
        });

      // 5️⃣ Call RetellAI API one by one using for loop with 1-second delay
      const callResults: any[] = [];
      for (const task of tasks) {
        const retellResponse = await CRMDataService.createBatchCall(task);
        callResults.push({ to_number: task.to_number, retellResponse });

        // 1-second delay between calls
        await sleep(1000);
      }

      // 6️⃣ Attach responses and Calendly slot to each CRM record
      const enrichedCategories = mainCategories.map((crm: any, index: number) => {
        const response = callResults.find((r) => r.to_number === crm.mobile_number);
        return {
          ...crm,
          retellResponse: response?.retellResponse || null,
        };
      });

      // 7️⃣ Return final result
      return successWithData("CRM data", enrichedCategories);
    } catch (error: any) {
      console.error("Error fetching CRM data:", error.message);
      return errorWithData("Something went wrong", error);
    }
  }

  //   public async getCRMData(
  //   verifyUser: any,
  //   pageSize: number,
  //   currentPage: number
  // )
  //  {
  //   try {
  //  // 1️⃣ Always returns [] if no slots
  //     const calendlySlot = await this.getCalendlyAvailableSlot();

  //   // 1️⃣ Build dynamic where condition
  //   let whereCondition = {};
  //   if (verifyUser.user_exist) {
  //     whereCondition = { isActive: true, isDeleted: false, need_to_call: true };
  //   }
  //   if (verifyUser.admin_exist) {
  //     whereCondition = { isDeleted: false, need_to_call: true };
  //   }

  //   // 2️⃣ Fetch CRM data with pagination
  //   const [mainCategories, totalItems] = await this.CRMDataRepository.findAndCount({
  //     where: whereCondition,
  //     order: { createdAt: "DESC" },
  //     skip: (currentPage - 1) * pageSize,
  //     take: pageSize,
  //   });

  //   const totalPages = Math.ceil(totalItems / pageSize);

  //   if (totalItems >= 1 && totalPages < currentPage) {
  //     return errorWithoutData("Page limit exceeded");
  //   }

  //   // let retellResponse: any = null;
  //   let retellResponse: any = null;
  //   // 3️⃣ Prepare tasks for RetellAI
  //   const tasks: RetellTask[] = mainCategories
  //     .filter((crm: any) => crm.mobile_number)
  //     .map((crm: any, index: number) => {
  //       const slot = calendlySlot.length > 0 ? calendlySlot[index % calendlySlot.length] : "";
  //       const name = crm.name ?? "";
  //       const client_name = crm.client_name ?? "";
  //       const leadId = crm.lead_id ? String(crm.lead_id) : "";
  //       const uniqueId = crm.unique_id ? String(crm.unique_id) : "";
  //       const property_type = crm.property_type ? String(crm.property_type) : "";
  //       const property_type_address_line2 = crm.property_type_address_line2 ? String(crm.property_type_address_line2) : "";
  //       const property_type_address_line3 = crm.property_type_address_line3 ? String(crm.property_type_address_line3) : "";
  //       const available_slot = crm.available_slot ? String(crm.available_slot) : "";
  //       const city = crm.city ? String(crm.city) : "";
  //       console.log("Mapping CRM for RetellAI:", {
  //         name,
  //         lead_id: leadId,
  //         unique_id: uniqueId,
  //         mobile_number: crm.mobile_number,
  //       });

  //       return {
  //         to_number: crm.mobile_number,
  //         retell_llm_dynamic_variables: {
  //           name,
  //           client_name,
  //           lead_id: leadId,
  //           unique_id: uniqueId,
  //           property_type: property_type,
  //           property_type_address_line2: property_type_address_line2,
  //           property_type_address_line3: property_type_address_line3,
  //           available_slot: available_slot,
  //           city: city,
  //           slot: calendlySlot,
  //           calendly_url: calendlySlot ?? "",
  //           greeting: `Hello, ${name}, ${leadId}, ${uniqueId} this is a test call from Retell!`,
  //         },
  //       };
  //     });

  //   // 4️⃣ Call the static RetellAI batch function
  //   if (tasks.length > 0) {
  //     retellResponse = await CRMDataService.createBatchCall(tasks.to);
  //   }

  //   // 5️⃣ Attach RetellAI response into each CRM record (optional)
  //   // const enrichedCategories = mainCategories.map((crm: any) => ({
  //   //   ...crm,
  //   //   retellResponse,
  //   // }));

  //     // 6️⃣ Attach RetellAI response and Calendly slot to each CRM record
  //     const enrichedCategories = mainCategories.map((crm: any, index: number) => ({
  //       ...crm,
  //      calendly_slot: calendlySlot[index % calendlySlot.length] || "",
  //       retellResponse,
  //     }));

  //   return successWithData("CRM data", enrichedCategories, {
  //     totalItems,
  //     totalPages,
  //     currentPage,
  //     pageSize,
  //   });
  // }
  // catch (error: any) {
  //     console.error("Error fetching CRM data:", error.message);
  //     return errorWithData("Something went wrong", error);
  //   }
  // }
  // public async getCRMData(
  //   verifyUser: any,
  //   pageSize: number,
  //   currentPage: number
  // ) {
  //   let whereCondition = {};
  //   if (verifyUser.user_exist) {
  //     whereCondition = { isActive: true, isDeleted: false, need_to_call: true };
  //   }
  //   if (verifyUser.admin_exist) {
  //     whereCondition = { isDeleted: false, need_to_call: true };
  //   }

  //   const [mainCategories, totalItems] =
  //     await this.CRMDataRepository.findAndCount({
  //       where: whereCondition, //  used dynamic condition
  //       order: { createdAt: "DESC" },
  //       skip: (currentPage - 1) * pageSize,
  //       take: pageSize,
  //     });

  //   const totalPages = Math.ceil(totalItems / pageSize);

  //   if (totalItems >= 1 && totalPages < currentPage) {
  //     return errorWithoutData("Page limit exceeded");
  //   }
  //   let retellResponse: any = null;

  //   //  RetellAI API Integration (using tasks array)
  //   try {
  //         const tasks: RetellTask[] = mainCategories
  //       .filter((crm: any) => crm.mobile_number)
  //       .map((crm: any) => {
  //         const name = crm.name ?? "";
  //         const leadId = crm.lead_id ? String(crm.lead_id) : "";
  //         const uniqueId = crm.unique_id ? String(crm.unique_id) : "";

  //         // ✅ Log each CRM record and the variables being used
  //         console.log("Mapping CRM:", {
  //           name,
  //           lead_id: leadId,
  //           unique_id: uniqueId,
  //           mobile_number: crm.mobile_number,
  //         });

  //         return {
  //           to_number: crm.mobile_number,
  //           retell_llm_dynamic_variables: {
  //             name,
  //             lead_id: leadId,
  //             unique_id: uniqueId,
  //             greeting: `Hello, ${name}, ${leadId}, ${uniqueId} this is a test call from Retell!`,
  //           },
  //         };
  //       });

  //     if (tasks.length > 0) {
  //       const payload = {
  //         from_number: `${process.env.RETELL_FROM_NUMBER}`,
  //         tasks: tasks,
  //         // llm_id: "default",
  //         // voice_id: "voice-1",
  //         retell_llm_dynamic_variables: {
  //           greeting: "Hello, this is a test call from Retell!",
  //         },
  //       };

  //       try {
  //         const response = await axios.post(
  //           "https://api.retellai.com/create-batch-call",
  //           payload,
  //           {
  //             headers: {
  //               Authorization: `Bearer ${process.env.API_KEY_RETELL}`,
  //               "Content-Type": "application/json",
  //             },
  //           }
  //         );

  //         retellResponse = response.data;

  //         console.log(" RetellAI response:", response.data);
  //       } catch (error: any) {
  //         if (error.response) {
  //           console.error(" RetellAI API Error:", {
  //             status: error.response.status,
  //             data: error.response.data,
  //           });
  //         } else if (error.request) {
  //           console.error(
  //             " No response received from RetellAI:",
  //             error.request
  //           );
  //         } else {
  //           console.error(" Error creating batch call:", error.message);
  //         }
  //       }
  //     }
  //   } catch (error: any) {
  //     console.error(
  //       "RetellAI API error:",
  //       error?.response?.data || error.message
  //     );
  //   }

  //   //  Attach retellResponse into each CRM record (optional, if you want per record)
  //   const enrichedCategories = mainCategories.map((crm: any) => ({
  //     ...crm,
  //     retellResponse,
  //   }));

  //   return successWithData("CRM data", enrichedCategories, {
  //     totalItems,
  //     totalPages,
  //     currentPage,
  //     pageSize,
  //   });
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
  public static async insertCRMData(dataArray: any[], fileName: string) {
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
        const mobile = item.mobilephone || "";

        // Skip empty rows
        if (!email && !mobile) {
          failCount++;
          continue;
        }

        // Generate leadId if not provided
        const timestampPart = `${now.getFullYear()}${(now.getMonth() + 1)
          .toString()
          .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}${now
            .getHours()
            .toString()
            .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now
              .getSeconds()
              .toString()
              .padStart(2, "0")}${now
                .getMilliseconds()
                .toString()
                .padStart(3, "0")}`;

        const leadId = item.leadid || `${timestampPart}`;

        // Check if lead_id already exists
        const existingRecord = await crmRepository.findOne({
          where: { lead_id: leadId },
        });

        if (existingRecord) {
          // ✅ Update existing record
          const updatedData = mapIncomingCRMData({
            ...existingRecord,
            ...item,
            email,
            mobile_number: mobile,
          });

          await crmRepository.update(existingRecord.id, updatedData);

          const updatedRecord = await crmRepository.findOne({
            where: { id: existingRecord.id },
          });

          if (updatedRecord) updatedRecords.push(updatedRecord);
          console.log(`Updated existing lead_id: ${leadId}`);
        } else {
          // ✅ Insert new record
          const mappedData = mapIncomingCRMData({
            ...item,
            email,
            mobile_number: mobile,
            lead_id: leadId,
            unique_id: leadId,
          });

          const savedRecord = await crmRepository.save(
            crmRepository.create(mappedData)
          );
          insertedRecords.push(savedRecord);

          // Create CallOutputData for each new CRM record
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

    // Save Excel history (link to first CRM record if available)
    const firstRecord = insertedRecords[0] || updatedRecords[0];
    const historyRecord = historyRepository.create({
      file_name: fileName,
      fail_count: failCount,
      correct_count: insertedRecords.length + updatedRecords.length,
      lead_id: firstRecord?.lead_id,
      crm_data: firstRecord,
    });
    await historyRepository.save(historyRecord);

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
