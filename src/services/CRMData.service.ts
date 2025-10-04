import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import path from "path";
import fs from 'fs';
import s3 from "../config/s3Bucket";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { CRMData } from "../entities/CRMData";
import axios from "axios";
import { ILike } from "typeorm";
import { CallOutputData } from "../entities/CallOutputData";
import { mapIncomingCRMData } from "../utils/mappercrm";
import XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";


interface RetellTask {
    to_number: string;
    retell_llm_dynamic_variables?: {
        name?: string;
        lead_id?: string;
        unique_id?: string;
        greeting?: string;
        [key: string]: any;
    };
}

export class CRMDataService {
    // Repository for CMR Data database operations
    private CRMDataRepository = AppDataSource.getRepository(CRMData);

    public async getCRMData(verifyUser: any, pageSize: number, currentPage: number) {
        let whereCondition = {};
        if (verifyUser.user_exist) {
            whereCondition = { isActive: true, isDeleted: false, need_to_call: true };
        }
        if (verifyUser.admin_exist) {
            whereCondition = { isDeleted: false, need_to_call: true };
        }

        const [mainCategories, totalItems] = await this.CRMDataRepository.findAndCount({
            where: whereCondition, //  used dynamic condition
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        if (totalItems >= 1 && totalPages < currentPage) {
            return errorWithoutData("Page limit exceeded");
        }
        let retellResponse: any = null;

        //  RetellAI API Integration (using tasks array)
        try {
            // const tasks: { to_number: string }[] = [];

            // for (const crm of mainCategories) {
            //     if ((crm as any).mobile_number) {
            //         tasks.push({ to_number: (crm as any).mobile_number });
            //     }
            // }
            // const tasks: RetellTask[] = mainCategories
            //     .filter((crm: any) => crm.mobile_number)
            //     .map((crm: any) => ({
                    
            //         to_number: crm.mobile_number,
            //         retell_llm_dynamic_variables: {
            //         name: crm.name ?? "",           
            //         lead_id: crm.lead_id ? String(crm.lead_id) : "",
            //         unique_id: crm.unique_id ? String(crm.unique_id) : "",
                     
            //             greeting: `Hello, ${crm.name}, ${crm.lead_id}, ${crm.unique_id} this is a test call from Retell!`
            //         }
            //     }));

            const tasks: RetellTask[] = mainCategories
  .filter((crm: any) => crm.mobile_number)
  .map((crm: any) => {
    const name = crm.name ?? "";
    const leadId = crm.lead_id ? String(crm.lead_id) : "";
    const uniqueId = crm.unique_id ? String(crm.unique_id) : "";

    // ✅ Log each CRM record and the variables being used
    console.log("Mapping CRM:", {
      name,
      lead_id: leadId,
      unique_id: uniqueId,
      mobile_number: crm.mobile_number
    });

    return {
      to_number: crm.mobile_number,
      retell_llm_dynamic_variables: {
        name,
        lead_id: leadId,
        unique_id: uniqueId,
        greeting: `Hello, ${name}, ${leadId}, ${uniqueId} this is a test call from Retell!`
      }
    };
  });

            if (tasks.length > 0) {
                const payload = {
                    from_number: `${process.env.RETELL_FROM_NUMBER}`,
                    tasks: tasks,
                    // llm_id: "default",
                    // voice_id: "voice-1",
                    retell_llm_dynamic_variables: {
                        greeting: "Hello, this is a test call from Retell!"
                    }
                };

                try {
                    const response = await axios.post(
                        "https://api.retellai.com/create-batch-call",
                        payload,
                        {
                            headers: {
                                Authorization:  `Bearer ${process.env.API_KEY_RETELL}`,
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    retellResponse = response.data;

                    
                    console.log(" RetellAI response:", response.data);

                } catch (error: any) {
                    if (error.response) {
                        console.error(" RetellAI API Error:", {
                            status: error.response.status,
                            data: error.response.data
                        });
                    } else if (error.request) {
                        console.error(" No response received from RetellAI:", error.request);
                    } else {
                        console.error(" Error creating batch call:", error.message);
                    }
                }
            }


        } catch (error: any) {
            console.error("RetellAI API error:", error?.response?.data || error.message);
        }

        //  Attach retellResponse into each CRM record (optional, if you want per record)
        const enrichedCategories = mainCategories.map((crm: any) => ({
            ...crm,
            retellResponse
        }));

        return successWithData("CRM data", enrichedCategories, {
            totalItems,
            totalPages,
            currentPage,
            pageSize,
        });
    }

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
            whereCondition.mobile_number = ILike(`%${mobile_number.replace(/\s+/g, '')}%`);
        }

        const crmData = await this.CRMDataRepository.find({
            where: whereCondition,
            order: { createdAt: 'DESC' },
        });

        // Return only name and mobile_number
        const simplifiedData = crmData.map(item => ({
            name: item.name,
            mobile_number: item.mobile_number
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
            return errorWithoutData("Error creating CRM Data: " + (error as Error).message);
        }
    }

//   public async createCRMDataWithoutAuth(Data: object) {
//     try {
//         // Save CRM record only
//         const newCRMData = this.CRMDataRepository.create(Data);
//         const crmdataoutput = await this.CRMDataRepository.save(newCRMData);

//         if (!crmdataoutput) {
//             return errorWithoutData('CRM Data not created');
//         }

//         // Return the CRM data inside an array
//         return successWithData("CRM data created successfully", [crmdataoutput]);

//     } catch (error) {
//         console.error("Error creating CRM data:", error);
//         return errorWithData("Something went wrong", error);
//     }
// }

// public async createCRMDataWithoutAuth(DataArray: object[]) {
//     try {
//         // Use .create() with an array to handle multiple records
//         const newCRMData = this.CRMDataRepository.create(DataArray);
//         const crmdataoutput = await this.CRMDataRepository.save(newCRMData);

//         if (!crmdataoutput || crmdataoutput.length === 0) {
//             return errorWithoutData('CRM Data not created');
//         }

//         // Return the CRM data array
//         return successWithData("CRM data created successfully", crmdataoutput);

//     } catch (error) {
//         console.error("Error creating CRM data:", error);
//         return errorWithData("Something went wrong", error);
//     }
// }

public async createCRMDataWithoutAuth(DataArray: object[]) {
    try {
        const insertedRecords: any[] = [];
        const skippedLeadIds: string[] = [];

        for (const rawData of DataArray) {
            const mappedData = mapIncomingCRMData(rawData);

            const existingRecord = await this.CRMDataRepository.findOne({
                where: { lead_id: mappedData.lead_id }
            });

            if (existingRecord) {
                skippedLeadIds.push(mappedData.lead_id);
                console.log(`Skipping existing lead_id: ${mappedData.lead_id}`);
                continue;
            }

            const newCRMData = this.CRMDataRepository.create(mappedData);
            const savedRecord = await this.CRMDataRepository.save(newCRMData);
            insertedRecords.push(savedRecord);



             const callOutputRepository = AppDataSource.getRepository(CallOutputData);
             const callOutput = callOutputRepository.create({
                crmData: savedRecord, 
                name: savedRecord.name,
                toNumber: savedRecord.mobile_number,
                lead_id: savedRecord.lead_id,
                callStatus: "net_to_call",
            });
            await callOutputRepository.save(callOutput);
        }


        
        // Always return result: true
        return {
            result: true,
            statuscode: 200,
            message:
                insertedRecords.length > 0
                    ? "CRM data created successfully"
                    : "No new CRM data created (all lead_id already exist)",
            data: {
                insertedRecords,
                skippedLeadIds,
            },
        };
    } catch (error) {
        console.error("Error creating CRM data:", error);
        return errorWithData("Something went wrong", error);
    }
}



  /**
   * Insert parsed CRM data and create CallOutputData
   */
 public static async insertCRMData(dataArray: any[]) {
  const crmRepository = AppDataSource.getRepository(CRMData);
  const callOutputRepository = AppDataSource.getRepository(CallOutputData);
  const insertedRecords: CRMData[] = [];
  const skippedLeadIds: string[] = [];

  for (const item of dataArray) {
    const now = new Date();
    const email = (item.emailaddress1 || "").toLowerCase();
    const mobile = item.mobilephone || "";

    // Skip empty rows
    if (!email && !mobile) continue;

    // Generate leadId (timestamp + random UUID part)
    const timestampPart = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}${now
      .getHours()
      .toString()
      .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}${now.getMilliseconds().toString().padStart(3, "0")}`;
    const randomPart = uuidv4().split("-")[0]; // first 8 chars of UUID
    const leadId = item.leadid || `${timestampPart}-${randomPart}`;

    // Check if lead_id already exists (rare because of timestamp + random)
    const existing = await crmRepository.findOne({
      where: { lead_id: leadId },
    });
    if (existing) {
      skippedLeadIds.push(existing.lead_id);
      continue;
    }

    // Map incoming data
    const mappedData = mapIncomingCRMData({
      ...item,
      email,
      mobile_number: mobile,
      lead_id: leadId,
      unique_id: uuidv4(),
      isActive: true,
      isDeleted: false,
      need_to_call: true,
      createdAt: now,
      updatedAt: now,
    });

    // Save CRMData
    const savedRecord = await crmRepository.save(crmRepository.create(mappedData));
    insertedRecords.push(savedRecord);

    // Create CallOutputData
    const callOutput = callOutputRepository.create({
      crmData: savedRecord,
      name: savedRecord.name,
      toNumber: savedRecord.mobile_number,
      lead_id: savedRecord.lead_id,
      callStatus: "need_to_call",
    });
    await callOutputRepository.save(callOutput);
  }

  return {
    result: true,
    statuscode: 200,
    message:
      insertedRecords.length > 0
        ? "CRM data created successfully"
        : "No new CRM data created (all lead_id already exist)",
    data: {
      insertedRecords,
      skippedLeadIds,
    },
  };
}




}
