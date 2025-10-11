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
    available_slot?: string;
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
  private async getCalendlyAvailableSlot(
    daysAhead: number = 7
  ): Promise<string[]> {
    try {
      const now = new Date();
      const start_time = now.toISOString(); // current UTC time
      const end_time = new Date(
        now.getTime() + daysAhead * 24 * 60 * 60 * 1000
      ).toISOString(); // X days ahead

      console.log("Calendly Start Time:", start_time);
      console.log("Calendly End Time:", end_time);

      const event_type =
        "https://api.calendly.com/event_types/6cc6e7d5-4efb-407b-a75d-78ba2905e02a";

      const calendlyResponse = await axios.get(
        "https://api.calendly.com/event_type_available_times",
        {
          headers: {
            Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`,
          },
          params: { start_time, end_time, event_type },
        }
      );

      const collection = calendlyResponse.data.collection || [];
      if (collection.length === 0) {
        console.warn("⚠️ No available Calendly slots found");
        return []; // ✅ return empty array, not null
      }

      // Return all scheduling URLs as array
      const slots = collection
        .filter(
          (slot: any) => slot.status === "available" && slot.scheduling_url
        )
        .map((slot: any) => slot.scheduling_url);

      return slots.length > 0 ? slots : [];
    } catch (error: any) {
      console.error("❌ Error fetching Calendly slots:", error.message);
      return []; // ✅ fallback empty array on error
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

  static async createBatchCall(task: RetellTask) {
    const payload = {
      from_number: process.env.RETELL_FROM_NUMBER,
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
    const calendlySlot = await this.getCalendlyAvailableSlot();

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
        const slot =
          calendlySlot && calendlySlot.length > 0
            ? calendlySlot[index % calendlySlot.length]
            : null; // null if no available slots

        const name = crm.name ?? "";
        const client_name = crm.client_name ?? "";
        const leadId = crm.lead_id ? String(crm.lead_id) : "";
        const uniqueId = crm.unique_id ? String(crm.unique_id) : "";

        return {
          to_number: crm.mobile_number,
          retell_llm_dynamic_variables: {
            name,
            client_name,
            lead_id: leadId,
            unique_id: uniqueId,
            property_type: crm.property_type ?? "",
            property_type_address_line2: crm.property_type_address_line2 ?? "",
            property_type_address_line3: crm.property_type_address_line3 ?? "",
            available_slot: crm.available_slot ?? "",
            city: crm.city ?? "",
            slot: slot ?? "", // always string or empty
            calendly_url: slot ?? "", // same
            greeting: `Hello ${name}, this is a test call from Retell!`,
          },
        };
      });

    // 5️⃣ Call RetellAI API for each CRM record individually
    const callResults = await Promise.all(
      tasks.map(async (task) => {
        const retellResponse = await CRMDataService.createBatchCall(task);
        return { to_number: task.to_number, retellResponse };
      })
    );

    // 6️⃣ Attach responses and Calendly slot to each CRM record
    const enrichedCategories = mainCategories.map((crm: any, index: number) => {
      const response = callResults.find((r) => r.to_number === crm.mobile_number);
      return {
        ...crm,
        calendly_slot: calendlySlot[index % calendlySlot.length] || "",
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
