import { DeepPartial } from "typeorm";
import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { CRMData } from "../entities/CRMData";
import { CallOutputData } from "../entities/CallOutputData";
import { In } from "typeorm";
import { CallOutputHistoryData } from "../entities/CallOutputHistoryData";
import { mapCallOutputData } from "../utils/mapper";
import { BatchCalling } from "../entities/BatchCalling";
const DEFAULT_PAGE_SIZE = Number(process.env.PAGE_SIZE) || 10;

export class callOutputDataService {
  private CRMDataRepository = AppDataSource.getRepository(CRMData);
  private BatchCallingRepository = AppDataSource.getRepository(BatchCalling);
  private callOutputRepository = AppDataSource.getRepository(CallOutputData);
  private historyRepository = AppDataSource.getRepository(CallOutputHistoryData);

  //Yet to Call
  public async getUsercallingData(verifyUser: any, pageSize: number, currentPage: number) {
    let whereCondition = {};

    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false };
    }

    const queryBuilder = this.callOutputRepository
      .createQueryBuilder("call_output")
      .leftJoinAndSelect("call_output.crmData", "crm")
      .where("call_output.isActive = :isActive AND call_output.isDeleted = :isDeleted AND crm.clear_all_data = :clear_all_data AND crm.isDeleted = :isDeleted", {
        isActive: true,
        isDeleted: false,
        clear_all_data:false
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
  static async getUsercallingHistory(
    from_date?: string,
    to_date?: string,
    from_time: string = "00:00:00",
    to_time: string = "23:59:59",
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE,
    toNumber?: string,
    status?: "completed" | "ongoing" | "yet_to_call" | "not_connected"
  ) {
    try {
      // Step 1: Base query
      let query = AppDataSource.getRepository(CallOutputData)
        .createQueryBuilder("call")
        .leftJoin(CRMData, "crm", "crm.id = call.crm_data_id")
        .andWhere('call."isActive" = TRUE')
        .andWhere('call."isDeleted" = FALSE')
        .andWhere('crm."isActive" = TRUE')
        .andWhere('crm."isDeleted" = FALSE');

      // Step 2: Date filter
      if (from_date && to_date) {
        const startTimestamp = new Date(`${from_date}T${from_time}`);
        const endTimestamp = new Date(`${to_date}T${to_time}`);
        query.andWhere('call."updatedAt" BETWEEN :start AND :end', {
          start: startTimestamp,
          end: endTimestamp,
        });
      }

      // Step 3: Status filter
      if (status === "completed") {
        query.andWhere('call."event" = :eventCompleted AND call."call_status" = :ended', {
          eventCompleted: "call_analyzed",
          ended: "ended",
        });
      } else if (status === "ongoing") {
        query.andWhere('call."event" = :eventOngoing AND call."call_status" = :ongoing', {
          eventOngoing: "call_started",
          ongoing: "ongoing",
        });
      } else if (status === "yet_to_call") {
        query.andWhere('call."event" = :eventCompleted AND call."call_status" = :yetToCall', {
          eventCompleted: "call_analyzed",
          yetToCall: "yet_to_call",
        });
      } else if (status === "not_connected") {
        query.andWhere('call."event" = :eventCompleted AND call."call_status" = :notConnected', {
          eventCompleted: "call_analyzed",
          notConnected: "not_connected",
        });
      } else {
        // All statuses
        query.andWhere(
          `( (call."event" = :eventCompleted AND call."call_status" = :ended) OR 
           (call."event" = :eventOngoing AND call."call_status" = :ongoing) OR
           (call."event" = :eventCompleted AND call."call_status" = :notConnected) OR
           (call."event" = :eventCompleted AND call."call_status" = :yetToCall) )`,
          {
            eventCompleted: "call_analyzed",
            ended: "ended",
            eventOngoing: "call_started",
            ongoing: "ongoing",
            notConnected: "not_connected",
            yetToCall: "yet_to_call",
          }
        );
      }

      // Step 4: ToNumber filter
      if (toNumber) {
        const normalizedNumber = toNumber.replace(/\s+/g, "");
        query.andWhere('call."to_number" ILIKE :toNumber', { toNumber: `%${normalizedNumber}%` });
      }

      // Step 5: Get all matching call IDs for correct pagination
      const allCallIdsRaw = await query.clone().select('call.id AS call_id').getRawMany();
      const allCallIds = allCallIdsRaw.map(r => r.call_id);

      // Step 6: Slice for requested page
      const paginatedIds = allCallIds.slice((page - 1) * pageSize, page * pageSize);

      // Step 7: If no IDs, return empty response
      if (paginatedIds.length === 0) {
        return {
          result: true,
          statuscode: 200,
          message: "Filtered call data fetched successfully!",
          data: [],
          pagination: {
            totalItems: allCallIds.length,
            totalPages: Math.ceil(allCallIds.length / pageSize),
            currentPage: page,
            pageSize,
          },
        };
      }

      // Step 8: Fetch full call data for these IDs
      const callsRaw = await query
        .andWhere('call.id IN (:...ids)', { ids: paginatedIds })
        .select([
          'call.id AS call_id',
          'call."to_number" AS to_number',
          'crm.name AS customer_name',
          'call."call_status" AS call_status',
          'call.recording_url',
          'call.duration_ms',
          'call."disconnection_reason" AS disconnection_reason',
          'call."transcript"',
          'call."end_reason"',
          'call."updatedAt" AS call_updatedAt',
          'call.event AS event',
          'call.appointment_date',
          'call.appointment_time',
          'call.booking_status',
          'call.calendly_booking_url',
          'call.sentiment_analysis',
        ])
        .orderBy('call."updatedAt"', "DESC")
        .getRawMany();

      // Step 9: Format duration and status
      const formattedCalls = callsRaw.map(call => {
        const ms = Number(call.duration_ms) || 0;
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return {
          ...call,
          duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
          status:
            call.event === "call_analyzed" && call.call_status === "ended"
              ? "Completed"
              : call.event === "call_started" && call.call_status === "ongoing"
                ? "Ongoing"
                : call.event === "call_analyzed" && call.call_status === "not_connected"
                  ? "Not Connected"
                  : call.event === "call_analyzed" && call.call_status === "yet_to_call"
                    ? "Yet to Call"
                    : "Unknown",
        };
      });

      // Step 10: Return response
      return {
        result: true,
        statuscode: 200,
        message: "Filtered call data fetched successfully!",
        data: formattedCalls,
        pagination: {
          totalItems: allCallIds.length,
          totalPages: Math.ceil(allCallIds.length / pageSize),
          currentPage: page,
          pageSize,
        },
      };
    } catch (error: any) {
      return {
        result: false,
        statuscode: 500,
        message: "Something went wrong while fetching call data.",
        error: error.message,
      };
    }
  }

  // To get Count Of User Call
  // public async getUserCallDataCount(verifyUser: any, pageSize: number, currentPage: number) {
  //   try {
  //     let whereCondition: any = {};
  //     if (verifyUser.user_exist) {
  //       whereCondition = { isActive: true, isDeleted: false, clear_all_data: false };
  //     }
  //     if (verifyUser.admin_exist) {
  //       whereCondition = { isDeleted: false };
  //     }

  //     // Total calls
  //     const totalCall = await this.callOutputRepository.count({ where: whereCondition });

  //     // Success count (Positive + Neutral)
  //     const successCounts = await this.callOutputRepository
  //       .createQueryBuilder("call")
  //       .where(whereCondition)
  //       .andWhere("call.sentimentAnalysis IN (:...allowed)", { allowed: ["Positive", "Neutral"] })
  //       .getCount();

  //     // Failure count (Negative)
  //     const failureCounts = await this.callOutputRepository
  //       .createQueryBuilder("call")
  //       .where(whereCondition)
  //       .andWhere("call.sentimentAnalysis = :neg", { neg: "Negative" })
  //       .getCount();

  //     // Not connected count
  //     const notConnectedCounts = await this.callOutputRepository
  //       .createQueryBuilder("call")
  //       .where(whereCondition)
  //       .andWhere("call.callStatus = :status", { status: "not_connected" })
  //       .getCount();

  //     // ✅ Need to call count (fixed)
  //     const needToCall = await this.CRMDataRepository
  //       .createQueryBuilder("call")
  //       .where(whereCondition)
  //       .andWhere("call.need_to_call = :needToCall", { needToCall: true })
  //       .getCount();


  //     // Return only counts
  //     return successWithData("User call detail Count fetched successfully", {
  //       totalCall,
  //       successCounts,
  //       failureCounts,
  //       notConnectedCounts,
  //       needToCall
  //     });

  //   } catch (error) {
  //     console.error("Error in getUserCallDataCount:", error);
  //     return errorWithData("Failed to fetch user call data", { error: (error as Error).message });
  //   }
  // }

  public async getUserCallDataCount(verifyUser: any, pageSize: number, currentPage: number) {
  try {
    // const totalCall = await this.callOutputRepository.count({ where: callWhereCondition });
const totalCall = await this.CRMDataRepository.createQueryBuilder("CRM_data")
  .innerJoin("CallOutputData", "call", "call.lead_id= CRM_data.lead_id")
  .where("CRM_data.isActive = true")
  .andWhere("CRM_data.isDeleted = false")
  .andWhere("CRM_data.clear_all_data = false")
  .getCount();

    // Success count (Positive + Neutral)
    const successCounts = await this.callOutputRepository
      .createQueryBuilder("call")
      .where("call.isActive = :isActive", { isActive: true })
      .andWhere("call.isDeleted = :isDeleted", { isDeleted: false })
      .andWhere("call.sentimentAnalysis IN (:...allowed)", { allowed: ["Positive", "Neutral"] })
      .getCount();

    // Failure count (Negative)
    const failureCounts = await this.callOutputRepository
      .createQueryBuilder("call")
      .where("call.isActive = :isActive", { isActive: true })
      .andWhere("call.isDeleted = :isDeleted", { isDeleted: false })
      .andWhere("call.sentimentAnalysis = :neg", { neg: "Negative" })
      .getCount();

    // Not connected count
    const notConnectedCounts = await this.callOutputRepository
      .createQueryBuilder("call")
      .where("call.isActive = :isActive", { isActive: true })
      .andWhere("call.isDeleted = :isDeleted", { isDeleted: false })
      .andWhere("call.callStatus = :status", { status: "not_connected" })
      .getCount();

    // ✅ Need to call count (CRMData table only)
    const needToCall = await this.CRMDataRepository
      .createQueryBuilder("call")
      .where("call.isActive = :isActive", { isActive: true })
      .andWhere("call.isDeleted = :isDeleted", { isDeleted: false })
      .andWhere("call.clear_all_data = :clearAllData", { clearAllData: false })
      .andWhere("call.need_to_call = :needToCall", { needToCall: true })
      .getCount();

    // ✅ Return final counts
    return successWithData("User call detail count fetched successfully", {
      totalCall,
      successCounts,
      failureCounts,
      notConnectedCounts,
      needToCall,
    });

  } catch (error) {
    console.error("Error in getUserCallDataCount:", error);
    return errorWithData("Failed to fetch user call data", { error: (error as Error).message });
  }
}

  public async createCallOutputData(reqBody: any) {
    try {
      // Extract raw data
      console.log(reqBody, "reqBodyreqBodyreqBody==========================");
      
      let raw = reqBody.raw_data;
      console.log(raw, "rawrawrawrawraw");

      //  Parse if JSON string
      if (typeof raw === "string") {
        try {
          raw = JSON.parse(raw);
        } catch (parseErr) {
          console.log(" test ", parseErr)
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
      const mappedData: DeepPartial<CallOutputData> = await mapCallOutputData(raw, reqBody);
      console.log(reqBody, "reqBodyreqBodyreqBodyreqBodyreqBody==============================");
      
      console.log("📥 Mapped Data:", mappedData);

      //  Find related CRM record by toNumber
      const crmRecord = await this.CRMDataRepository.findOne({
        where: { lead_id: mappedData.lead_id, isDeleted: false },
      });


      const batchRecord = await this.BatchCallingRepository.findOne({
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

      //  if (crmRecord && savedCall.callStatus !== "not_connected"  && savedCall.durationMs !== null) {
      // if ((crmRecord && savedCall.callStatus !== "not_connected" && savedCall.durationMs !== null) && (crmRecord && savedCall.callStatus !== "unkown" && savedCall.durationMs < 10000)) {

      if ((crmRecord && savedCall.callStatus !== "not_connected" && savedCall.durationMs !== null) || (crmRecord && savedCall.callStatus !== "unkown" && savedCall.durationMs < 10000)) {
        crmRecord.need_to_call = false;
        await this.CRMDataRepository.save(crmRecord);

        // Update BatchCalling
        if (batchRecord) {
          batchRecord.need_to_call = false;
          batchRecord.send_to_retail = true;
          batchRecord.call_status = "completed"; // instead of "pending"
          await this.BatchCallingRepository.save(batchRecord);
        }


        console.log("CRM record updated (need_to_call=false)");
      }
      // console.log(savedCall, "savitaaaaaaaaaaaaaaa");

      return successWithData("Call output data created successfully", savedCall);
    } catch (error) {
      console.log(" Error creating call output data:", error);
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