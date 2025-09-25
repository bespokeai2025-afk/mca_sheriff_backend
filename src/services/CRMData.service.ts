import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import path from "path";
import fs from 'fs';
import s3 from "../config/s3Bucket";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { CRMData } from "../entities/CRMData";
import axios from "axios";
export class CRMDataService {
    // Repository for CMR Data database operations
    private CRMDataRepository = AppDataSource.getRepository(CRMData);

    public async getCRMData(verifyUser: any, pageSize: number, currentPage: number) {
        let whereCondition = {};
        if (verifyUser.user_exist) {
            whereCondition = { isActive: true, isDeleted: false };
        }
        if (verifyUser.admin_exist) {
            whereCondition = { isDeleted: false };
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
            const tasks: { to_number: string }[] = [];

            for (const crm of mainCategories) {
                if ((crm as any).mobile_number) {
                    tasks.push({ to_number: (crm as any).mobile_number });
                }
            }

            // if (tasks.length > 0) {
            //     const payload = {
            //         from_number: "+18326624593",
            //         tasks: tasks,
            //         llm_id: "default",
            //         voice_id: "voice-1",
            //         retell_llm_dynamic_variables: {
            //             greeting: "Hello, this is a test call from Retell!"
            //         }
            //     };

            //     const response = await axios.post(
            //         "https://api.retellai.com/create-batch-call",
            //         payload,
            //         {
            //             headers: {
            //                 Authorization: "Bearer key_356dc6fbbd933c9b159e0411e4fa",
            //                 "Content-Type": "application/json"
            //             }
            //         }
            //     );

            //     retellResponse = response.data;
            //     console.log("RetellAI response:", response.data);
            // }

            if (tasks.length > 0) {
                const payload = {
                    from_number: "+18326624593",
                    tasks: tasks,
                    llm_id: "default",
                    voice_id: "voice-1",
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
                                Authorization: "Bearer key_356dc6fbbd933c9b159e0411e4fa",
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

      public async getUsercrmData(verifyUser: any, pageSize: number, currentPage: number) {
     
     
             let whereCondition = {};
             if (verifyUser.user_exist) {
                 whereCondition = { isActive: true, isDeleted: false };
             }
             if (verifyUser.admin_exist) {
     
                 whereCondition = { isDeleted: false };
     
             }
     
             const [mainCategories, totalItems] = await this.CRMDataRepository .findAndCount({
                 where: { isActive: true, isDeleted: false },
                 order: { createdAt: 'DESC' },
                 skip: (currentPage - 1) * pageSize,
                 take: pageSize
             });
     
     
             const totalPages = Math.ceil(totalItems / pageSize);
     
             if (totalItems >= 1 && totalPages < currentPage) {
                 return errorWithoutData("Page limit exceeded")
             }
             return successWithData("User CRM data get successfully !", mainCategories, {
                 totalItems,
                 totalPages,
                 currentPage,
                 pageSize
             });
     
         } 

    public async createCRMData(Data: object, verifyUser: any) {

        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can create CMR Data')
        }

        const newCMRData = await this.CRMDataRepository.create(Data)

        const crmdataoutput = await this.CRMDataRepository.save(newCMRData)

        if (!crmdataoutput) {
            return errorWithoutData('CMR Data not created')
        }
        return successWithData("crm data created successfully", crmdataoutput);

    }   
}
