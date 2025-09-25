import { DeepPartial } from "typeorm";
import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import path from "path";
import fs from 'fs';
import s3 from "../config/s3Bucket";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { CRMData } from "../entities/CRMData";
import { CallOutputData } from "../entities/CallOutputData";
import { CallOutputHistoryData } from "../entities/CallOutputHistoryData";
import { mapCallOutputData } from "../utils/mapper";

export class callOutputDataService {
        private CRMDataRepository = AppDataSource.getRepository(CRMData);
    private callOutputRepository = AppDataSource.getRepository(CallOutputData);
    private historyRepository = AppDataSource.getRepository(CallOutputHistoryData);

    public async getUsercallingData(verifyUser: any, pageSize: number, currentPage: number) {


        let whereCondition = {};
        if (verifyUser.user_exist) {
            whereCondition = { isActive: true, isDeleted: false };
        }
        if (verifyUser.admin_exist) {

            whereCondition = { isDeleted: false };

        }

        const [mainCategories, totalItems] = await this.callOutputRepository.findAndCount({
            where: { isActive: true, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize
        });


        const totalPages = Math.ceil(totalItems / pageSize);

        if (totalItems >= 1 && totalPages < currentPage) {
            return errorWithoutData("Page limit exceeded")
        }
        return successWithData("User calling data ", mainCategories, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });

    } 

     public async getUserCallDataCount(verifyUser: any, pageSize: number, currentPage: number) {
        try {
            let whereCondition: any = {};
            if (verifyUser.user_exist) {
                whereCondition = { isActive: true, isDeleted: false };
            }
            if (verifyUser.admin_exist) {
                whereCondition = { isDeleted: false };
            }

            // Fetch paginated results
            const [mainCategories, totalItems] = await this.callOutputRepository.findAndCount({
                where: whereCondition,
                order: { createdAt: 'DESC' },
                skip: (currentPage - 1) * pageSize,
                take: pageSize
            });

            const totalPages = Math.ceil(totalItems / pageSize);

            if (totalItems >= 1 && totalPages < currentPage) {
                return errorWithoutData("Page limit exceeded");
            }

            // 🔹 Count only positive & neutral sentimentAnalysis
            const sentimentCounts = await this.callOutputRepository
                .createQueryBuilder("call")
                .select("call.sentimentAnalysis", "sentimentAnalysis")
                .addSelect("COUNT(*)", "count")
                .where(whereCondition)
                .andWhere("call.sentimentAnalysis IN (:...allowed)", { allowed: ["positive", "neutral"] })
                .groupBy("call.sentimentAnalysis")
                .getRawMany();

            // 🔹 Count callStatus distribution
            const statusCounts = await this.callOutputRepository
                .createQueryBuilder("call")
                .select("call.callStatus", "callStatus")
                .addSelect("COUNT(*)", "count")
                .where(whereCondition)
                .groupBy("call.callStatus")
                .getRawMany();

            return successWithData("User call detail Count", mainCategories, {
                totalItems,
                totalPages,
                currentPage,
                pageSize,
                sentimentCounts,
                statusCounts
            } as any); // quick fix


        } catch (error) {
            console.error("Error in getUserCallData:", error);
            return errorWithData("Failed to fetch user call data", { error: (error as Error).message });
        }
    }

    public async createCallOutputData(reqBody: any) {
    try {
    let raw = reqBody.raw_data;

    // 1️⃣ Parse JSON string if raw_data is a string
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch (parseErr) {
        return errorWithData("Invalid JSON in raw_data", { raw, parseErr });
      }
    }

    // 2️⃣ Handle array
    if (Array.isArray(raw)) {
      raw = raw[0];
    }

    // 3️⃣ Ensure raw is object
    if (!raw || typeof raw !== "object") {
      return errorWithoutData("Invalid request: raw_data is missing or malformed");
    }

    // 4️⃣ Map fields
    const mappedData: DeepPartial<CallOutputData> = await mapCallOutputData(raw);
    console.log("📥 Final Mapped Data for DB:", mappedData);

    // 5️⃣ Check CRMData for number (using toNumber here, adjust if you want fromNumber instead)
    const crmRecord = await this.CRMDataRepository.findOne({
      where: { mobile_number: mappedData.toNumber, isDeleted: false }
    });

    if (crmRecord) {
      // 🔄 If number exists → set crm_data_id
      mappedData.crm_data_id = crmRecord.id;
    } else {
      mappedData.crm_data_id = null; // default
    }

    // 6️⃣ Check if callId already exists → update
    const existingCall = await this.callOutputRepository.findOne({
      where: { callId: mappedData.callId }
    });

    if (existingCall) {
      // update
      const updated = await this.callOutputRepository.save({
        ...existingCall,
        ...mappedData
      });
      return successWithData("Call output data updated successfully", updated);
    }

    // 7️⃣ Insert new record
    const newCallData = this.callOutputRepository.create(mappedData);
    const saved = await this.callOutputRepository.save(newCallData);

    if (!saved) {
      return errorWithoutData("Call output data not created");
    }

    return successWithData("Call output data created successfully", saved);
  } catch (error) {
    console.error("❌ Error creating call output data:", error);
    return errorWithData("Failed to create call output data", {
      error: (error as Error).message
    });
  }
}

    // public async createCallOutputData(reqBody: any) {
    // try {
    //     let raw = reqBody.raw_data;

    //     // 1️⃣ Parse JSON string if raw_data is a string
    //     if (typeof raw === "string") {
    //     try {
    //         raw = JSON.parse(raw);
    //     } catch (parseErr) {
    //         return errorWithData("Invalid JSON in raw_data", { raw, parseErr });
    //     }
    //     }

    //     // 2️⃣ Handle array (if data comes wrapped in an array, pick first)
    //     if (Array.isArray(raw)) {
    //     raw = raw[0];
    //     }

    //     // 3️⃣ Ensure raw is an object
    //     if (!raw || typeof raw !== "object") {
    //     return errorWithoutData("Invalid request: raw_data is missing or malformed");
    //     }

    //     // 4️⃣ Pass raw directly (not raw.body!)
    //     const mappedData: DeepPartial<CallOutputData> = await mapCallOutputData(raw);
    //     console.log("📥 Final Mapped Data for DB:", mappedData);

    //     // 5️⃣ Create entity instance
    //     const newCallData = this.callOutputRepository.create(mappedData);

    //     // 6️⃣ Save to DB
    //     const saved = await this.callOutputRepository.save(newCallData);

    //     if (!saved) {
    //     return errorWithoutData("Call output data not created");
    //     }

    //     return successWithData("Call output data created successfully", saved);
    // } catch (error) {
    //     console.error("❌ Error creating call output data:", error);
    //     return errorWithData("Failed to create call output data", { error: (error as Error).message });
    // }
    // }  
    public async updateCallOutputData(id: string, Data: { [key: string]: any }, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("Only admin can update call output data");
        }

        const faq = await this.callOutputRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!faq) {
            return errorWithoutData("call output data not found");
        }

        // Update main table
        const updatedData = JSON.parse(JSON.stringify(Data));
        await this.callOutputRepository.update(id.toString(), updatedData);

        // Insert into history table
        const historyRecord = this.historyRepository.create({
            call_output_data_id: id,
            // crm_data_id: updatedData.crm_data_id ?? faq.crm_data_id,
            // vendor_id: updatedData.vendor_id ?? faq.vendor_id,
            // end_reason: updatedData.end_reason ?? faq.end_reason,
            // call_status: updatedData.call_status ?? faq.call_status,
            // agent_name: updatedData.agent_name ?? faq.agent_name,
            // customer_name: updatedData.customer_name ?? faq.customer_name,
            // from_number: updatedData.from_number ?? faq.from_number,
            // to_number: updatedData.to_number ?? faq.to_number,
            // start_timestamp: updatedData.start_timestamp ?? faq.start_timestamp,
            // end_timestamp: updatedData.end_timestamp ?? faq.end_timestamp,
            // duration_ms: updatedData.duration_ms ?? faq.duration_ms,
            // direction: updatedData.direction ?? faq.direction,
            // transcript: updatedData.transcript ?? faq.transcript,
            // call_summary: updatedData.call_summary ?? faq.call_summary,
            // recording_url: updatedData.recording_url ?? faq.recording_url,
            // user_sentiment: updatedData.user_sentiment ?? faq.user_sentiment,
            // call_successful: updatedData.call_successful ?? faq.call_successful,
            // customer_was_satisfied: updatedData.customer_was_satisfied ?? faq.customer_was_satisfied,
            // reason_for_call: updatedData.reason_for_call ?? faq.reason_for_call,
            // call_cost_combined_cost: updatedData.call_cost_combined_cost ?? faq.call_cost_combined_cost,
            // latency_e2e_p50: updatedData.latency_e2e_p50 ?? faq.latency_e2e_p50,
            // disconnection_reason: updatedData.disconnection_reason ?? faq.disconnection_reason,
            // llm_token_usage_average: updatedData.llm_token_usage_average ?? faq.llm_token_usage_average,
            // telephony_identifier_twilio_call_sid: updatedData.telephony_identifier_twilio_call_sid ?? faq.telephony_identifier_twilio_call_sid,
            // event: updatedData.event ?? faq.event,
            // call_type: updatedData.call_type ?? faq.call_type,
            // agent_version: updatedData.agent_version ?? faq.agent_version,
        });

        await this.historyRepository.save(historyRecord);

        return successWithoutData("call output data updated successfully");
    }
    public async deletefaq(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("user cann't update attendance")
        }
        const faq = await this.callOutputRepository.findOneBy({ id });

        if (!faq) {
            return errorWithoutData(" faq not found");
        }

        faq.isDeleted = true; // Mark as soft deleted
        await this.callOutputRepository.save(faq);

        return successWithoutData(" faq soft deleted successfully");
    }

}