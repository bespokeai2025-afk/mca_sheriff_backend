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
interface RetellTask {
    to_number: string;
    retell_llm_dynamic_variables?: {
        name?: string;
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
            // const tasks: { to_number: string }[] = [];

            // for (const crm of mainCategories) {
            //     if ((crm as any).mobile_number) {
            //         tasks.push({ to_number: (crm as any).mobile_number });
            //     }
            // }
            const tasks: RetellTask[] = mainCategories
                .filter((crm: any) => crm.mobile_number)
                .map((crm: any) => ({
                    to_number: crm.mobile_number,
                    retell_llm_dynamic_variables: {
                        name: crm.name,
                        greeting: `Hello, ${crm.name}, this is a test call from Retell!`
                    }
                }));

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
                                Authorization: "Bearer key_8a1db7d9cbae67fb1318855fdcd2",
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
        pageSize: number,
        currentPage: number,
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

            const [crmData, totalItems] = await this.CRMDataRepository.findAndCount({
                where: whereCondition,
                order: { createdAt: 'DESC' },
                skip: mobile_number ? 0 : (currentPage - 1) * pageSize,
                take: mobile_number ? undefined : pageSize,
            });

            const totalPages = mobile_number ? 1 : Math.ceil(totalItems / pageSize);

            return successWithData(
                "User CRM data fetched successfully!",
                crmData,
                {
                    totalItems,
                    totalPages,
                    currentPage: mobile_number ? 1 : currentPage,
                    pageSize: mobile_number ? totalItems : pageSize,
                }
            );

        } catch (error) {
            return errorWithData("Something went wrong", { error });
        }
    }

    // public async createCRMData(Data: object, verifyUser: any) {

    //     if (verifyUser.user_exist) {
    //         return errorWithoutData('Only admin can create CMR Data')
    //     }

    //     const newCMRData = await this.CRMDataRepository.create(Data)

    //     const crmdataoutput = await this.CRMDataRepository.save(newCMRData)

    //     if (!crmdataoutput) {
    //         return errorWithoutData('CMR Data not created')
    //     }
    //     return successWithData("crm data created successfully", crmdataoutput);

    // }


    public async createCRMData(Data: object, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can create CMR Data');
        }

        // Save CRM record
        const newCRMData = this.CRMDataRepository.create(Data);
        const crmdataoutput = await this.CRMDataRepository.save(newCRMData);

        if (!crmdataoutput) {
            return errorWithoutData('CRM Data not created');
        }

        // 🔹 Insert into call_output_data with "Yet to call"
        const callOutputRepository = AppDataSource.getRepository(CallOutputData);

        const callOutput = callOutputRepository.create({
            crm_data_id: crmdataoutput.id,
            name: crmdataoutput.name,
            toNumber: crmdataoutput.mobile_number,
            callStatus: "Yet to call",
        });

        await callOutputRepository.save(callOutput);

        return successWithData("CRM data created successfully", {
            crmdata: crmdataoutput,
            callOutput,
        });
    }
}
