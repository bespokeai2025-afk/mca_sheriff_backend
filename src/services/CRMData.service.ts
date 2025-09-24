/**
 * Service for handling faq business logic
 * Handles database operations and business rules for main categories
 */

import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import path from "path";

// Import AWS S3 related dependencies
import fs from 'fs';
import s3 from "../config/s3Bucket";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { CRMData } from "../entities/CRMData";
import axios from "axios";

export class CRMDataService {
    // Repository for faq database operations
    private faqRepository = AppDataSource.getRepository(CRMData);

    /**
     * Get all active main categories
     * @returns Promise with success response containing categories or error response
     */
    // public async getCRMData(verifyUser: any, pageSize: number, currentPage: number) {

    //     let whereCondition = {};
    //     if (verifyUser.user_exist) {
    //         whereCondition = { isActive: true, isDeleted: false };
    //     }
    //     if (verifyUser.admin_exist) {
    //         whereCondition = { isDeleted: false };
    //     }

    //     const [mainCategories, totalItems] = await this.faqRepository.findAndCount({
    //         where: { isActive: true, isDeleted: false },
    //         order: { createdAt: 'DESC' },
    //         skip: (currentPage - 1) * pageSize,
    //         take: pageSize
    //     });

    //     const totalPages = Math.ceil(totalItems / pageSize);

    //     if (totalItems >= 1 && totalPages < currentPage) {
    //         return errorWithoutData("Page limit exceeded")
    //     }

    //     // ✅ RetellAI API Integration
    //     try {
    //         for (const crm of mainCategories) {
    //             if ((crm as any).mobile_number) {   // make sure your entity has a phoneNumber field
    //                 const payload = {
    //                     from_number: "+18326624593",
    //                     to_number: (crm as any).mobile_number,
    //                     llm_id: "default",
    //                     voice_id: "voice-1",
    //                     retell_llm_dynamic_variables: {
    //                         greeting: "Hello, this is a test call from Retell!"
    //                     }
    //                 };

    //                 await axios.post("https://api.retellai.com/v2/create-phone-call", payload, {
    //                     headers: {
    //                         Authorization: "Bearer key_356dc6fbbd933c9b159e0411e4fa",
    //                         "Content-Type": "application/json"
    //                     }
    //                 });
    //             }
    //         }
    //     } catch (error: any) {
    //         console.error("RetellAI API error:", error?.response?.data || error.message);
    //     }

    //     return successWithData("CRM data ", mainCategories, {
    //         totalItems,
    //         totalPages,
    //         currentPage,
    //         pageSize
    //     });

    // }

    //   public async getCRMData(verifyUser: any, pageSize: number, currentPage: number) {

    //     let whereCondition = {};
    //     if (verifyUser.user_exist) {
    //         whereCondition = { isActive: true, isDeleted: false };
    //     }
    //     if (verifyUser.admin_exist) {
    //         whereCondition = { isDeleted: false };
    //     }

    //     const [mainCategories, totalItems] = await this.faqRepository.findAndCount({
    //         where: { isActive: true, isDeleted: false },
    //         order: { createdAt: 'DESC' },
    //         skip: (currentPage - 1) * pageSize,
    //         take: pageSize
    //     });

    //     const totalPages = Math.ceil(totalItems / pageSize);

    //     if (totalItems >= 1 && totalPages < currentPage) {
    //         return errorWithoutData("Page limit exceeded")
    //     }

    //     let retellResponse=null;

    //     // ✅ RetellAI API Integration (using tasks array)
    //     try {
    //         const tasks: { to_number: string }[] = [];

    //         for (const crm of mainCategories) {
    //             if ((crm as any).mobile_number) {   // ensure entity has phoneNumber field
    //                 tasks.push({ to_number: (crm as any).mobile_number });
    //             }
    //         }

    //         if (tasks.length > 0) {
    //             const payload = {
    //                 from_number: "+18326624593",
    //                 tasks: tasks,
    //                 llm_id: "default",
    //                 voice_id: "voice-1",
    //                 retell_llm_dynamic_variables: {
    //                     greeting: "Hello, this is a test call from Retell!"
    //                 }
    //             };

    //             const response = await axios.post("https://api.retellai.com/create-batch-call", payload, {
    //                 headers: {
    //                     Authorization: "Bearer key_356dc6fbbd933c9b159e0411e4fa",
    //                     "Content-Type": "application/json"
    //                 }
    //             });

    //             retellResponse=response;
    //             console.log("RetellAI response:", response.data);
    //         }
    //     } catch (error: any) {
    //         console.error("RetellAI API error:", error?.response?.data || error.message);
    //     }

    //     return successWithData("CRM data ", mainCategories, {
    //         totalItems,
    //         totalPages,
    //         currentPage,
    //         pageSize,
            
    //     });

    // }
public async getCRMData(verifyUser: any, pageSize: number, currentPage: number) {
    let whereCondition = {};
    if (verifyUser.user_exist) {
        whereCondition = { isActive: true, isDeleted: false };
    }
    if (verifyUser.admin_exist) {
        whereCondition = { isDeleted: false };
    }

    const [mainCategories, totalItems] = await this.faqRepository.findAndCount({
        where: whereCondition, // ✅ used dynamic condition
        order: { createdAt: 'DESC' },
        skip: (currentPage - 1) * pageSize,
        take: pageSize
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalItems >= 1 && totalPages < currentPage) {
        return errorWithoutData("Page limit exceeded");
    }

    let retellResponse: any = null;

    // ✅ RetellAI API Integration (using tasks array)
    try {
        const tasks: { to_number: string }[] = [];

        for (const crm of mainCategories) {
            if ((crm as any).mobile_number) {
                tasks.push({ to_number: (crm as any).mobile_number });
            }
        }

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
            console.log("RetellAI response:", response.data);
        }
    } catch (error: any) {
        console.error("RetellAI API error:", error?.response?.data || error.message);
    }

    // ✅ Attach retellResponse into each CRM record (optional, if you want per record)
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
    public async createCRMData(Data: object, verifyUser: any) {

        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can create faq')
        }

        const newfaq = await this.faqRepository.create(Data)

        const faq = await this.faqRepository.save(newfaq)

        if (!faq) {
            return errorWithoutData('faq not created')
        }
        return successWithData("crm data created successfully", faq);

    }

    /**
     * Update an existing faq
     * @param id - The ID of the faq to update
     * @param Data - Object containing updated faq data
     * @returns Promise with success response or error response
     */
    public async updatefaq(id: string, Data: { [key: string]: any }, verifyUser: any) {

        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can update faq')
        }

        const faq = await this.faqRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!faq) {
            return errorWithoutData('faq not found')
        }

        // if (faq.image && Data.image) {
        //     const oldKey = faq.image.split(".com/")[1];
        //     await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: oldKey }));
        // }

        const updatedData = JSON.parse(JSON.stringify(Data));
        await this.faqRepository.update(id.toString(), updatedData);
        return successWithoutData('faq updated successfully');

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
