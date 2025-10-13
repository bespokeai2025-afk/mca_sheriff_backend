import axios from "axios";
import { PhoneNumber } from "../entities/PhoneNumberEntity";
import { CRMDataService } from "./CRMData.service"
import { AllCompanyNumbersAndAgents } from "../entities/All_Company_Numbers_and_Agents";



interface RetellPhoneNumber {
  phone_number: string;
  outbound_agent_id: string | null;
  is_active?: boolean;

}

type InputPhonenumber = {
  phone_number: string;
  outbound_agent_id: string;
  outbound_agent_name?: string;
  is_active: boolean | string;
};

export class PhoneNumberService {

  // static async getPhoneNumbers(): Promise<any> {
  //   const activeNumbers = await CRMDataService.syncRetellAIandDB();
  //   if (!activeNumbers) {
  //     console.warn("❌ No active phone numbers found in DB");
  //     return { result: false, message: "No active phone numbers found in DB" };
  //   }
  //   const url = "https://api.retellai.com/list-phone-numbers";
  //   const headers = {
  //     Authorization: `Bearer ${process.env.API_KEY_RETELL}`,
  //     "Content-Type": "application/json",
  //   };

  //   try {
  //     // 1️⃣ fetch list-phone-numbers
  //     const response = await axios.get(url, { headers });
  //     const retellPhoneNumbers: RetellPhoneNumber[] = response.data || [];

  //     // 2️⃣ fetch active numbers from DB
  //     const dbPhoneNumbers = await PhoneNumber.find({ where: { is_active: true } });

  //     // 3️⃣ collect unique agent ids
  //     const agentIds = new Set<string>();
  //     for (const num of retellPhoneNumbers) {
  //       if (num.outbound_agent_id) agentIds.add(num.outbound_agent_id);
  //     }

  //     // 4️⃣ fetch agent details in parallel
  //     const agentNameMap = new Map<string, string>();
  //     await Promise.all(
  //       Array.from(agentIds).map(async (agentId) => {
  //         try {
  //           const agentRes = await axios.get(`https://api.retellai.com/get-agent/${agentId}`, { headers });
  //           const a = agentRes.data || {};
  //           const name =
  //             a.agent_name ??
  //             a.name ??
  //             a.agent?.agent_name ??
  //             a.agent?.name ??
  //             null;
  //           agentNameMap.set(agentId, name ?? "Unknown Agent");
  //         } catch (err: any) {
  //           console.warn(`Could not fetch agent ${agentId}:`, err.response?.status, err.message);
  //           agentNameMap.set(agentId, "Unknown Agent");
  //         }
  //       })
  //     );

  //     // 5️⃣ merge and detect agent changes
  //     const merged = retellPhoneNumbers.map((num) => {
  //       const dbEntry = dbPhoneNumbers.find(
  //         (p) => p.phone_number === num.phone_number
  //       );
  //       const sameOutboundAgent =
  //         dbEntry?.outbound_agent_id === num.outbound_agent_id;

  //       return {
  //         phone_number: num.phone_number,
  //         outbound_agent_id: num.outbound_agent_id,
  //         outbound_agent_name: num.outbound_agent_id
  //           ? agentNameMap.get(num.outbound_agent_id) || "Unknown Agent"
  //           : null,
  //         is_active: sameOutboundAgent ? dbEntry?.is_active ?? false : false,
  //       };
  //     });

  //     return {
  //       result: true,
  //       statuscode: 200,
  //       message: "Phone numbers fetched successfully",
  //       data: merged,
  //     };
  //   } catch (error: any) {
  //     console.error("Error fetching phone numbers from RetellAI:", error.response?.data || error.message);
  //     throw new Error("Failed to fetch phone numbers from RetellAI");
  //   }
  // }
  static async getPhoneNumbers(): Promise<any> {
    const activeNumbers = await CRMDataService.syncRetellAIandDB();
    if (!activeNumbers) {
      console.warn("❌ No active phone numbers found in DB");
      return { result: false, message: "No active phone numbers found in DB" };
    }

    const url = "https://api.retellai.com/list-phone-numbers";
    const headers = {
      Authorization: `Bearer ${process.env.API_KEY_RETELL}`,
      "Content-Type": "application/json",
    };

    try {
      // 1️⃣ Fetch list-phone-numbers from Retell
      const response = await axios.get(url, { headers });
      const retellPhoneNumbers: RetellPhoneNumber[] = response.data || [];

      // 2️⃣ Fetch active phone numbers from DB
      const dbPhoneNumbers = await PhoneNumber.find({ where: { is_active: true } });

      // 3️⃣ Fetch all company numbers (flatten all phone_number arrays)
      const allCompanyRecords = await AllCompanyNumbersAndAgents.find();
      const allowedPhoneNumbers = new Set<string>(
        allCompanyRecords.flatMap((rec) => rec.phone_number)
      );

      // 4️⃣ Collect unique outbound agent IDs
      const agentIds = new Set<string>();
      for (const num of retellPhoneNumbers) {
        if (num.outbound_agent_id) agentIds.add(num.outbound_agent_id);
      }

      // 5️⃣ Fetch agent details in parallel
      const agentNameMap = new Map<string, string>();
      await Promise.all(
        Array.from(agentIds).map(async (agentId) => {
          try {
            const agentRes = await axios.get(`https://api.retellai.com/get-agent/${agentId}`, { headers });
            const a = agentRes.data || {};
            const name =
              a.agent_name ??
              a.name ??
              a.agent?.agent_name ??
              a.agent?.name ??
              null;
            agentNameMap.set(agentId, name ?? "Unknown Agent");
          } catch (err: any) {
            console.warn(`Could not fetch agent ${agentId}:`, err.response?.status, err.message);
            agentNameMap.set(agentId, "Unknown Agent");
          }
        })
      );

      // 6️⃣ Merge Retell + DB + Agent info
      const merged = retellPhoneNumbers.map((num) => {
        const dbEntry = dbPhoneNumbers.find(
          (p) => p.phone_number === num.phone_number
        );
        const sameOutboundAgent =
          dbEntry?.outbound_agent_id === num.outbound_agent_id;

        return {
          phone_number: num.phone_number,
          outbound_agent_id: num.outbound_agent_id,
          outbound_agent_name: num.outbound_agent_id
            ? agentNameMap.get(num.outbound_agent_id) || "Unknown Agent"
            : null,
          is_active: sameOutboundAgent ? dbEntry?.is_active ?? false : false,
        };
      });

      // 7️⃣ Filter only allowed phone numbers
      const filtered = merged.filter((num) => allowedPhoneNumbers.has(num.phone_number));

      return {
        result: true,
        statuscode: 200,
        message: "Phone numbers fetched successfully",
        data: filtered,
      };
    } catch (error: any) {
      console.error("Error fetching phone numbers from RetellAI:", error.response?.data || error.message);
      throw new Error("Failed to fetch phone numbers from RetellAI");
    }
  }

  static async savePhoneNumber(phonenumbers: InputPhonenumber[]): Promise<any> {
    const savedPhoneNumbers: PhoneNumber[] = [];

    try {
      // 1️⃣ Loop through input phone numbers
      for (const input of phonenumbers) {
        const isActive = input.is_active === true || input.is_active === "true";

        // 2️⃣ Remove inactive numbers from DB
        if (!isActive) {
          const existing = await PhoneNumber.findOne({ where: { phone_number: input.phone_number } });
          if (existing) await PhoneNumber.remove(existing);
          continue;
        }

        // 3️⃣ Find existing record or create new
        let phoneRecord = await PhoneNumber.findOne({ where: { phone_number: input.phone_number } });
        if (!phoneRecord) phoneRecord = new PhoneNumber();

        // 4️⃣ Assign fields (no phone_number_id)
        phoneRecord.phone_number = input.phone_number;
        phoneRecord.outbound_agent_id = input.outbound_agent_id ?? "N/A";
        phoneRecord.outbound_agent_name = input.outbound_agent_name ?? "N/A";
        phoneRecord.is_active = true;

        await phoneRecord.save();
        savedPhoneNumbers.push(phoneRecord);
      }

      return {
        result: true,
        statuscode: 200,
        message: "Phone numbers saved successfully",
        data: savedPhoneNumbers,
      };
    } catch (error: any) {
      console.error("Error saving phone numbers:", error);
      return {
        result: false,
        statuscode: 500,
        message: "Failed to save phone numbers",
        data: [],
      };
    }
  }

  // Fetch all phone numbers + live voicemail from Retell
  static async getAllWithVoicemail() {
    const phoneNumbers = await PhoneNumber.find(); // just to get list of agents
    const RETELL_API_KEY = process.env.API_KEY_RETELL;
    const headers = { Authorization: `Bearer ${RETELL_API_KEY}` };

    const phoneNumbersWithVoicemail = await Promise.all(
      phoneNumbers.map(async (num) => {
        if (!num.outbound_agent_id) return { ...num, voicemail_enabled: false, voicemail_text: "" };

        try {
          const res = await axios.get(
            `https://api.retellai.com/get-agent/${num.outbound_agent_id}`,
            { headers }
          );

          const voicemailData = res.data?.voicemail_option;

          return {
            ...num,
            voicemail_enabled: !!voicemailData,
            voicemail_text: voicemailData?.action?.text || "",
          };
        } catch (err: any) {
          console.error("Error fetching voicemail for agent", num.outbound_agent_id, err.message);
          return { ...num, voicemail_enabled: false, voicemail_text: "" };
        }
      })
    );

    return phoneNumbersWithVoicemail;
  }

  // Update voicemail directly in Retell (no DB update)
  static async updateVoicemailById(outbound_agent_id: string, enable: boolean, text?: string) {
    if (!process.env.API_KEY_RETELL) throw new Error("Missing RETELL_API_KEY in env");

    const headers = { Authorization: `Bearer ${process.env.API_KEY_RETELL}`, "Content-Type": "application/json" };
    const payload = enable
      ? { voicemail_option: { action: { type: "static_text", text: text || "Hi, please leave a message!" } } }
      : { voicemail_option: null };

    try {
      const res = await axios.patch(
        `https://api.retellai.com/update-agent/${outbound_agent_id}`,
        payload,
        { headers }
      );
      return { result: true, data: res.data };
    } catch (err: any) {
      return { result: false, message: err.message, data: err.response?.data || null };
    }
  }
}





