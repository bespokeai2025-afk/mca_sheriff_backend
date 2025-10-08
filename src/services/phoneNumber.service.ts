import axios from "axios";
import { PhoneNumber } from "../entities/PhoneNumberEntity";

interface RetellPhoneNumber {
  phone_number_id: string;
  phone_number: string;
  region: string;
  inbound_agent_id: string | null;
  outbound_agent_id: string | null;
}

export class PhoneNumberService {
  static async getPhoneNumbers(): Promise<any> {
    const url = "https://api.retellai.com/list-phone-numbers";
    const headers = {
      Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
      "Content-Type": "application/json",
    };

    try {
      // 1️⃣ Fetch phone numbers from RetellAI
      const response = await axios.get(url, { headers });
      const retellPhoneNumbers: RetellPhoneNumber[] = response.data || [];

      // 2️⃣ Fetch active phone numbers from DB
      const dbPhoneNumbers = await PhoneNumber.find({ where: { is_active: true } });
      const dbPhoneNumberIds = new Set(dbPhoneNumbers.map((p) => p.phone_number_id));

      // 3️⃣ Merge & mark active
      const merged = retellPhoneNumbers.map((num) => ({
        phone_number_id: num.phone_number_id,
        phone_number: num.phone_number,
        region: num.region,
        inbound_agent_id: num.inbound_agent_id,
        outbound_agent_id: num.outbound_agent_id,
        is_active: dbPhoneNumberIds.has(num.phone_number_id),
      }));

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
}
