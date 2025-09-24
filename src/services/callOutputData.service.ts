/**
 * Service for handling faq business logic
 * Handles database operations and business rules for main categories
 */
import { DeepPartial } from "typeorm";
import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import path from "path";

// Import AWS S3 related dependencies
import fs from 'fs';
import s3 from "../config/s3Bucket";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { CallOutputData } from "../entities/CallOutputData";
import { CallOutputHistoryData } from "../entities/CallOutputHistoryData";
import { mapCallOutputData } from "../utils/mapper";

export class callOutputDataService {
    // Repository for faq database operations


    private faqRepository = AppDataSource.getRepository(CallOutputData);
 private historyRepository = AppDataSource.getRepository(CallOutputHistoryData);
    /**
     * Get all active main categories
     * @returns Promise with success response containing categories or error response
     */
    public async getUsercallingData(verifyUser: any, pageSize: number, currentPage: number) {


        let whereCondition = {};
        if (verifyUser.user_exist) {
            whereCondition = { isActive: true, isDeleted: false };
        }
        if(verifyUser.admin_exist)
            {
        
                whereCondition = {isDeleted: false };
    
        }

        const [mainCategories, totalItems] = await this.faqRepository.findAndCount({
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

    /**
     * Find a faq by ID
     * @param id - The ID of the faq to find
     * @returns Promise with success response containing the faq or error response if not found
     */
    public async findfaqById(id: string, verifyUser: any) {

        let faq = null;
        if (verifyUser.admin_exist) {
            faq = await this.faqRepository.findOne({ where: { id: id, isDeleted: false } })
        } else {
            faq = await this.faqRepository.findOne({ where: { isActive: true, isDeleted: false, id: id } })
        }

        if (!faq) {
            return errorWithoutData('faq not found')
        }

        return successWithData("faq found", faq);
    }

    /**
     * Create a new faq
     * @param Data - Object containing faq data
     * @returns Promise with success response containing the created faq or error response
     */
    // public async createCallOutputData(Data: object ) {

      

    //     const newfaq = await this.faqRepository.create(Data)

    //     const faq = await this.faqRepository.save(newfaq)

    //     if (!faq) {
    //         return errorWithoutData('faq not created')
    //     }
    //     return successWithData("call output data created successfully", faq);

    // }
// public async createCallOutputData(Data: object) {
//     const newfaq = await this.faqRepository.create(Data);
//     console.log("call dataaaaaaaaaaaaaa", newfaq);
//     // Save to DB
//     const faq = await this.faqRepository.save(newfaq);

//     if (!faq) {
//         return errorWithoutData("faq not created");
//     }

//     return successWithData("call output data created successfully", faq);
// }

//  public async createCallOutputData(reqBody: any) {
//     try {
//       let raw = reqBody.raw_data;

//       // 1️⃣ Parse JSON string if raw_data is a string
//       if (typeof raw === "string") {
//         try {
//           raw = JSON.parse(raw);
//         } catch (parseErr) {
//           return errorWithData("Invalid JSON in raw_data", { raw, parseErr });
//         }
//       }

//       // 2️⃣ Handle array (if data comes wrapped in an array, pick first)
//       if (Array.isArray(raw)) {
//         raw = raw[0];
//       }

//       // 3️⃣ Validate existence of body
//     //   if (!raw?.body) {
//     //     return errorWithoutData("Invalid request: missing body inside raw_data");
//     //   }

//       // 4️⃣ Map request body to DB entity structure
//       const mappedData: DeepPartial<CallOutputData> = await mapCallOutputData(raw.body);
//       console.log("📥 Final Mapped Data for DB:", mappedData);

//       // 5️⃣ Create entity instance
//       const newCallData = this.faqRepository.create(mappedData);

//       // 6️⃣ Save to DB
//       const saved = await this.faqRepository.save(newCallData);

//       if (!saved) {
//         return errorWithoutData("Call output data not created");
//       }

//       return successWithData("Call output data created successfully", saved);
//     } catch (error) {
//       console.error("❌ Error creating call output data:", error);
//       return errorWithData("Failed to create call output data", { error: (error as Error).message });
//     }
//   }

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

    // 2️⃣ Handle array (if data comes wrapped in an array, pick first)
    if (Array.isArray(raw)) {
      raw = raw[0];
    }

    // 3️⃣ Ensure raw is an object
    if (!raw || typeof raw !== "object") {
      return errorWithoutData("Invalid request: raw_data is missing or malformed");
    }

    // 4️⃣ Pass raw directly (not raw.body!)
    const mappedData: DeepPartial<CallOutputData> = await mapCallOutputData(raw);
    console.log("📥 Final Mapped Data for DB:", mappedData);

    // 5️⃣ Create entity instance
    const newCallData = this.faqRepository.create(mappedData);

    // 6️⃣ Save to DB
    const saved = await this.faqRepository.save(newCallData);

    if (!saved) {
      return errorWithoutData("Call output data not created");
    }

    return successWithData("Call output data created successfully", saved);
  } catch (error) {
    console.error("❌ Error creating call output data:", error);
    return errorWithData("Failed to create call output data", { error: (error as Error).message });
  }
}

    /**
     * Update an existing faq
     * @param id - The ID of the faq to update
     * @param Data - Object containing updated faq data
     * @returns Promise with success response or error response
     */
    // public async updateCallOutputData(id: string, Data: { [key: string]: any }, verifyUser: any) {



    //     if (verifyUser.user_exist) {
    //         return errorWithoutData('Only admin can update call output data')
    //     }

    //     const faq = await this.faqRepository.findOneBy({ id, isActive: true, isDeleted: false });
    //     if (!faq) {
    //         return errorWithoutData('call output data not found')
    //     }

    //     // if (faq.image && Data.image) {
    //     //     const oldKey = faq.image.split(".com/")[1];
    //     //     await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: oldKey }));
    //     // }


    //     const updatedData = JSON.parse(JSON.stringify(Data));
    //     await this.faqRepository.update(id.toString(), updatedData);
    //     return successWithoutData('call output data updated successfully');

    // }
    public async updateCallOutputData(id: string, Data: { [key: string]: any }, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("Only admin can update call output data");
        }

        const faq = await this.faqRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!faq) {
            return errorWithoutData("call output data not found");
        }

        // Update main table
        const updatedData = JSON.parse(JSON.stringify(Data));
        await this.faqRepository.update(id.toString(), updatedData);

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
    
    /**
     * Soft delete a faq
     * @param id - The ID of the faq to delete
     * @returns Promise with success response or error response
     */

    public async deletefaq(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("user cann't update attendance")
        }
        const faq = await this.faqRepository.findOneBy({ id });

        if (!faq) {
            return errorWithoutData(" faq not found");
        }

        faq.isDeleted = true; // Mark as soft deleted
        await this.faqRepository.save(faq);

        return successWithoutData(" faq soft deleted successfully");
    }
    public async activefaq(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("user cann't update attendance")
        }
        const faq = await this.faqRepository.findOneBy({ id });

        if (!faq) {
            return errorWithoutData("faq not found");
        }

        faq.isActive = !faq.isActive; // Mark as deleted
        await this.faqRepository.save(faq);

        return successWithoutData("faq dectivetd successfully");
    }
}