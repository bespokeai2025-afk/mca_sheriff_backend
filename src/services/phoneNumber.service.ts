import axios from "axios";
import { PhoneNumber } from "../entities/PhoneNumberEntity";
import { CRMDataService } from "./CRMData.service"


interface RetellPhoneNumber {
  phone_number_id: string;
  phone_number: string;
  outbound_agent_id: string | null;
  is_active?: boolean;

}

type InputPhonenumber = {
  phone_number_id: string;
  phone_number: string;
  outbound_agent_id: string;
  outbound_agent_name?: string;
  is_active: boolean | string;
};

export class PhoneNumberService {

  static async getPhoneNumbers(): Promise<any> {
  const url = "https://api.retellai.com/list-phone-numbers";
  const headers = {
    Authorization:  `Bearer ${process.env.API_KEY_RETELL}`,
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
        phone_number_id: num.phone_number_id,
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
    const savedPhoneNumber: PhoneNumber[] = [];

    try {
      // 1️⃣ Fetch all Phonenumber from RetellAI

      const retellNumbers = await CRMDataService.fetchRetellPhoneNumbers();
      
      // 2️⃣ Deduplicate phone number by agent_id (take latest version)
      const retailMap = new Map<string, any>();
      for (const a of retellNumbers) {
        retailMap.set(a.phone_number_id, a);
      }

      // 3️⃣ Loop through input phone numbers
      for (const inputPhoneNumber of phonenumbers) {
        const isActive = inputPhoneNumber.is_active === true || inputPhoneNumber.is_active === "true";

        if (!isActive) {
          const existing = await PhoneNumber.findOne({ where: { phone_number: inputPhoneNumber.phone_number } });
          if (existing) await PhoneNumber.remove(existing);
          continue;
        }

        // Try to find an existing record
        let phonenumber = await PhoneNumber.findOne({ where: { phone_number: inputPhoneNumber.phone_number } });
        if (!phonenumber) {
          phonenumber = new PhoneNumber();
        }

        // ✅ Required field
        phonenumber.phone_number_id =
          inputPhoneNumber.phone_number_id ||
          `custom_${inputPhoneNumber.phone_number.replace(/\D/g, "")}`; // fallback unique id

        phonenumber.phone_number = inputPhoneNumber.phone_number;
        phonenumber.outbound_agent_id = inputPhoneNumber.outbound_agent_id ?? "N/A";
        phonenumber.outbound_agent_name = inputPhoneNumber.outbound_agent_name ?? "N/A";
        phonenumber.is_active = true;

        await phonenumber.save();
        savedPhoneNumber.push(phonenumber);
      }


      return {
        result: true,
        statuscode: 200,
        message: "Phone number saved successfully",
        data: savedPhoneNumber,
      };
    } catch (error: any) {
      console.error("Error saving phone number:", error.message);
      return {
        result: false,
        statuscode: 500,
        message: "Failed to save phone number",
        data: [],
      };
    }
  }
}
