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


// interface RetellTask {
//   to_number: string;
//   retell_llm_dynamic_variables?: {
//     name?: string;
//     lead_id?: string;
//     unique_id?: string;
//     greeting?: string;
//     [key: string]: any;
//   };
// }
export interface RetellTask {
  to_number: string;
  retell_llm_dynamic_variables?: {
    name?: string;
    client_name?: string;
    lead_id?: string;
    unique_id?: string;
    greeting?: string;
    [key: string]: any;
  };
}
export class CRMDataService {
  // Repository for CMR Data database operations
  private CRMDataRepository = AppDataSource.getRepository(CRMData);

  // static async createBatchCall(tasks: RetellTask[]) {
  //   if (tasks.length === 0) return null;

  //   const payload = {
  //     from_number: process.env.RETELL_FROM_NUMBER,
  //     tasks: tasks,
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


  static async startBatchCalling(tasks: RetellTask[]) {
    if (tasks.length === 0) return null;

    try {
      const activeNumbers = await PhoneNumber.find({ where: { is_active: true } });
      if (!activeNumbers.length) {
        return { result: false, message: "No active phone numbers found in DB" };
      }

      const retellNumbers = await this.fetchRetellPhoneNumbers();

      const updatePromises: Promise<any>[] = [];
      for (const dbNumber of activeNumbers) {
        const retellMatch = retellNumbers.find((r: any) => r.phone_number === dbNumber.phone_number);
        if (!retellMatch) continue;

        const retellOutboundAgentId = retellMatch.outbound_agent_id;
        if (dbNumber.outbound_agent_id !== retellOutboundAgentId) {
          updatePromises.push(
            axios.post(`http://localhost:3003/phoneNumber/update-phonenumbersfrom-retell`, {
              phone_number: dbNumber.phone_number,
              outbound_agent_id: retellOutboundAgentId,
              outbound_agent_name: retellMatch.outbound_agent_name || null,
              inbound_agent_id: retellMatch.inbound_agent_id || null,
              inbound_agent_name: retellMatch.inbound_agent_name || null,
              is_active: dbNumber.is_active,
            })
          );
        }
      }

      await Promise.all(updatePromises);



      const headers = {
        Authorization: `Bearer ${process.env.API_KEY_RETELL}`,
        "Content-Type": "application/json",
      };
      const payload = {
        from_number: process.env.RETELL_FROM_NUMBER,
        tasks: tasks,
        retell_llm_dynamic_variables: {
          greeting: "Hello, this is a test call from Retell!",
        },
      };

      const batchResponse = await axios.post(
        "https://api.retellai.com/create-batch-call",
        payload,
        { headers }
      );

      return { result: true, message: "Batch calling started successfully", data: batchResponse.data };
    } catch (error: any) {
      console.error("Error starting batch calling:", error.response?.data || error.message);
      return { result: false, message: "Failed to start batch calling", error: error.response?.data || error.message };
    }
  }

  public async getCRMData(
    verifyUser: any,
    pageSize: number,
    currentPage: number
  ) {
    // 1️⃣ Build dynamic where condition
    let whereCondition = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false, need_to_call: true };
    }
    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false, need_to_call: true };
    }

    // 2️⃣ Fetch CRM data with pagination
    const [mainCategories, totalItems] = await this.CRMDataRepository.findAndCount({
      where: whereCondition,
      order: { createdAt: "DESC" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalItems >= 1 && totalPages < currentPage) {
      return errorWithoutData("Page limit exceeded");
    }

    let retellResponse: any = null;

    // 3️⃣ Prepare tasks for RetellAI
    const tasks: RetellTask[] = mainCategories
      .filter((crm: any) => crm.mobile_number)
      .map((crm: any) => {
        const name = crm.name ?? "";
        const client_name = crm.client_name ?? "";
        const leadId = crm.lead_id ? String(crm.lead_id) : "";
        const uniqueId = crm.unique_id ? String(crm.unique_id) : "";

        console.log("Mapping CRM for RetellAI:", {
          name,
          lead_id: leadId,
          unique_id: uniqueId,
          mobile_number: crm.mobile_number,
        });

        return {
          to_number: crm.mobile_number,
          retell_llm_dynamic_variables: {
            name,
            client_name,
            lead_id: leadId,
            unique_id: uniqueId,
            greeting: `Hello, ${name}, ${leadId}, ${uniqueId} this is a test call from Retell!`,
          },
        };
      });

    // 4️⃣ Call the static RetellAI batch function
    if (tasks.length > 0) {
      retellResponse = await CRMDataService.startBatchCalling(tasks);
    }

    // 5️⃣ Attach RetellAI response into each CRM record (optional)
    const enrichedCategories = mainCategories.map((crm: any) => ({
      ...crm,
      retellResponse,
    }));

    return successWithData("CRM data", enrichedCategories, {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    });
  }
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
            });
            await callOutputRepository.save(callOutput);
          }
        } catch (innerError: unknown) {
          // ✅ Safely handle unknown error type
          const errorMessage =
            innerError instanceof Error ? innerError.message : String(innerError);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
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
              .padStart(2, "0")}${now.getMilliseconds().toString().padStart(3, "0")}`;

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
