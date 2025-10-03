import { DeepPartial } from "typeorm";
import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import path from "path";
import fs from 'fs';
import s3 from "../config/s3Bucket";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { CRMData } from "../entities/CRMData";
import { CallOutputData } from "../entities/CallOutputData";
import { ILike } from "typeorm";
import { In } from "typeorm";
import { CallOutputHistoryData } from "../entities/CallOutputHistoryData";
import { mapCallOutputData } from "../utils/mapper";

export class callOutputDataService {
  private CRMDataRepository = AppDataSource.getRepository(CRMData);
  private callOutputRepository = AppDataSource.getRepository(CallOutputData);
  private historyRepository = AppDataSource.getRepository(CallOutputHistoryData);





  //Yet to Call
  public async getUsercallingData(verifyUser: any, pageSize: number, currentPage: number) {
    let whereCondition = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false };
    }
    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false };
    }

    const queryBuilder = this.callOutputRepository
      .createQueryBuilder("call_output")
      .leftJoinAndSelect("call_output.crmData", "crm")
      .where("call_output.isActive = :isActive AND call_output.isDeleted = :isDeleted", {
        isActive: true,
        isDeleted: false,
      })
      .orderBy("call_output.createdAt", "DESC")
      .skip((currentPage - 1) * pageSize)
      .take(pageSize);

    const [data, totalItems] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalItems >= 1 && totalPages < currentPage) {
      return errorWithoutData("Page limit exceeded");
    }

    return successWithData("User call data response fetched successfully!", data, {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    });
  }


  


  // Call data Response Lead 
  public async getUsercallingDataLead(verifyUser: any, pageSize: number, currentPage: number) {
    let whereCondition: any = {};

    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false };
    }
    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false };
    }

    // Add sentiment filter (positive, neutral)
    whereCondition = {
      ...whereCondition,
      sentimentAnalysis: In(["Positive", "Neutral"])
    };

    const [mainCategories, totalItems] = await this.callOutputRepository.findAndCount({
      where: whereCondition,
      order: { createdAt: "DESC" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalItems >= 1 && totalPages < currentPage) {
      return errorWithoutData("Page limit exceeded");
    }

    return successWithData("User calling lead fetched successfully !", mainCategories, {
      totalItems,
      totalPages,
      currentPage,
      pageSize
    });
  }



//Call Status and history
public async getUsercallingHistory(
  verifyUser: any,
  pageSize: number,
  currentPage: number,
  toNumber?: string,
  status?: "completed" | "ongoing"
) {
  try {
    let whereCondition: any[] = [];

    // Normalize status
    status = status?.toLowerCase() as "completed" | "ongoing" | undefined;

    // Base conditions
    const baseConditions: any = {
      isDeleted: false,
      isActive: true,
    };

    if (verifyUser.user_exist) {
      baseConditions.isActive = true;
      baseConditions.isDeleted = false;
    }

    if (verifyUser.admin_exist) {
      baseConditions.isDeleted = false;
    }

    // Prepare conditions
    const completedCond: any = { ...baseConditions, event: "call_analyzed", callStatus: "ended" };
    const ongoingCond: any = { ...baseConditions, event: "call_started", callStatus: "ongoing" };

    // Apply number filter
    if (toNumber) {
      const normalizedNumber = toNumber.replace(/\s+/g, "");
      completedCond.toNumber = ILike(`%${normalizedNumber}%`);
      ongoingCond.toNumber = ILike(`%${normalizedNumber}%`);
    }

    // Set whereCondition based on status
    if (status === "completed") {
      whereCondition = [completedCond];
    } else if (status === "ongoing") {
      whereCondition = [ongoingCond];
    } else {
      whereCondition = [completedCond, ongoingCond]; // both
    }

    // Fetch data
    const [calls, totalItems] = await this.callOutputRepository.findAndCount({
      where: whereCondition,
      order: { createdAt: "DESC" },
      skip: toNumber ? 0 : (currentPage - 1) * pageSize,
      take: toNumber ? undefined : pageSize,
    });

    const totalPages = toNumber ? 1 : Math.ceil(totalItems / pageSize);

    // Format response
    const data = calls.map((call) => ({
      id: call.id,
      name: call.name,
      callId: call.callId,
      toNumber: call.toNumber,
      fromNumber: call.fromNumber,
      transcript: call.transcript,
      recordingUrl: call.recordingUrl,
      event: call.event,
      callStatus: call.callStatus,
      status:
        call.event === "call_analyzed" && call.callStatus === "ended"
          ? "Completed"
          : call.event === "call_started" && call.callStatus === "ongoing"
          ? "Ongoing"
          : "Unknown", // fallback just in case
      sentimentAnalysis: call.sentimentAnalysis,
      createdAt: call.createdAt,
    }));

    return {
      result: true,
      statuscode: 200,
      message: "User calling history fetched successfully!",
      data,
      pagination: {
        totalItems,
        totalPages,
        currentPage: toNumber ? 1 : currentPage,
        pageSize: toNumber ? totalItems : pageSize,
      },
    };
  } catch (error: any) {
    return {
      result: false,
      statuscode: 500,
      message: "Something went wrong while fetching user history.",
      error: error.message,
    };
  }
}





  // To get Count Of User Call



  public async getUserCallDataCount(verifyUser: any, pageSize: number, currentPage: number) {
  try {
    let whereCondition: any = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false };
    }
    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false };
    }

    // Total calls
    const totalCall = await this.callOutputRepository.count({ where: whereCondition });

    // Success count (Positive + Neutral)
    const successCounts = await this.callOutputRepository
      .createQueryBuilder("call")
      .where(whereCondition)
      .andWhere("call.sentimentAnalysis IN (:...allowed)", { allowed: ["Positive", "Neutral"] })
      .getCount();

    // Failure count (Negative)
    const failureCounts = await this.callOutputRepository
      .createQueryBuilder("call")
      .where(whereCondition)
      .andWhere("call.sentimentAnalysis = :neg", { neg: "Negative" })
      .getCount();

    // Not connected count
    const notConnectedCounts = await this.callOutputRepository
      .createQueryBuilder("call")
      .where(whereCondition)
      .andWhere("call.callStatus = :status", { status: "not_connected" })
      .getCount();

    // Return only counts
    return successWithData("User call detail Count fetched successfully", {
      totalCall,
      successCounts,
      failureCounts,
      notConnectedCounts,
    });

  } catch (error) {
    console.error("Error in getUserCallDataCount:", error);
    return errorWithData("Failed to fetch user call data", { error: (error as Error).message });
  }
}



  public async createCallOutputData(reqBody: any) {
    try {
      // Extract raw data
      let raw = reqBody.raw_data;

      //  Parse if JSON string
      if (typeof raw === "string") {
        try {
          raw = JSON.parse(raw);
        } catch (parseErr) {
          return errorWithData("Invalid JSON in raw_data", { raw, parseErr });
        }
      }

      //  If raw_data is array, pick first element
      if (Array.isArray(raw)) {
        raw = raw[0];
      }

      //  Validate raw object
      if (!raw || typeof raw !== "object") {
        return errorWithoutData("Invalid request: raw_data is missing or malformed");
      }

      //  Map raw data to entity
      const mappedData: DeepPartial<CallOutputData> = await mapCallOutputData(raw);
      console.log("📥 Mapped Data:", mappedData);

      //  Find related CRM record by toNumber
      const crmRecord = await this.CRMDataRepository.findOne({
        where: { lead_id: mappedData.lead_id, isDeleted: false },
      });
      // mappedData.crm_data_id = crmRecord ? crmRecord.id : null;
      if (crmRecord) {
        mappedData.crmData = crmRecord;
      }

      //  Check if call already exists (by toNumber)
      let existingCall = await this.callOutputRepository.findOne({
        where: { lead_id: mappedData.lead_id },
      });

      let savedCall: CallOutputData;

      if (existingCall) {
        // Update existing call
        savedCall = await this.callOutputRepository.save({
          ...existingCall,
          ...mappedData,
        });
        // console.log("🔄 Existing call updated");
      } else {
        // 🆕 Insert new call
        const newCall = this.callOutputRepository.create(mappedData);
  
        
        savedCall = await this.callOutputRepository.save(newCall);
        console.log("🆕 New call created");
      }

      // 8️⃣ Always insert a history record
      const historyRecord = this.historyRepository.create({
        ...mappedData,
        call_output_data_id: savedCall.id,
      } as DeepPartial<CallOutputHistoryData>);

      await this.historyRepository.save(historyRecord);
      console.log("📝 History record saved");

      if (crmRecord) {
        crmRecord.need_to_call = false;
        await this.CRMDataRepository.save(crmRecord);
        console.log("CRM record updated (need_to_call=false)");
    }
    console.log(savedCall, "savitaaaaaaaaaaaaaaa");
    
      return successWithData("Call output data created successfully", savedCall);
    } catch (error) {
      console.error(" Error creating call output data:", error);
      return errorWithData("Failed to create call output data", {
        error: (error as Error).message,
      });
    }
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