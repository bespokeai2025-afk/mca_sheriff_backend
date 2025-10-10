import axios from "axios";
import { PhoneNumber } from "../entities/PhoneNumberEntity";
import { CRMDataService } from "./CRMData.service"



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
      // 1️⃣ fetch list-phone-numbers
      const response = await axios.get(url, { headers });
      const retellPhoneNumbers: RetellPhoneNumber[] = response.data || [];

      // 2️⃣ fetch active numbers from DB
      const dbPhoneNumbers = await PhoneNumber.find({ where: { is_active: true } });

      // 3️⃣ collect unique agent ids
      const agentIds = new Set<string>();
      for (const num of retellPhoneNumbers) {
        if (num.outbound_agent_id) agentIds.add(num.outbound_agent_id);
      }

      // 4️⃣ fetch agent details in parallel
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

      // 5️⃣ merge and detect agent changes
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

      return {
        result: true,
        statuscode: 200,
        message: "Phone numbers fetched successfully",
        data: merged,
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

}
