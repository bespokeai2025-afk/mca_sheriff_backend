/**
 * Service for handling refrence Slider business logic
 * Handles database operations and business rules for main categories
 */

import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import path from "path";

// Import AWS S3 related dependencies
import fs from 'fs';
import s3 from "../config/s3Bucket";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { RefrenceSlider } from "../entities/RefrenceSlider";



export class refrenceSliderService {
    // Repository for refrence Slider database operations


    private refrenceSliderRepository = AppDataSource.getRepository(RefrenceSlider);

    /**
     * Get all active main categories
     * @returns Promise with success response containing categories or error response
     */
    public async getrefrenceSlider(verifyUser: any) {
        let whereCondition = {};
        if (verifyUser.user_exist) {
            whereCondition = { isActive: true, isDeleted: false };
        }

        const [refrenceSliders, totalItems] = await this.refrenceSliderRepository.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' }
        });


        const formattedRefrenceSliders = refrenceSliders.map(slider => ({
            ...slider,
            image: slider.image && slider.image.trim() !== ""
                ? slider.image
                : `http://${process.env.LOCAL_DB_HOST}/uploads/homebanner.png`
        }));

        return successWithData("all  refrence sliders", formattedRefrenceSliders);
    }

    /**
     * Find a refrence Slider by ID
     * @param id - The ID of the category to find
     * @returns Promise with success response containing the category or error response if not found
     */
    public async findrefrenceSliderById(id: string, verifyUser: any) {

        let refrenceSlider = null;
        if (verifyUser.admin_exist) {
            refrenceSlider = await this.refrenceSliderRepository.findOne({ where: { id: id } })
        } else {
            refrenceSlider = await this.refrenceSliderRepository.findOne({ where: { isActive: true, isDeleted: false, id: id } })
        }

        if (!refrenceSlider) {
            return errorWithoutData('refrence Slider not found')
        }

        return successWithData("refrence Slider found", refrenceSlider);
    }

    /**
     * Create a new refrence Slider
     * @param Data - Object containing category data
     * @returns Promise with success response containing the created category or error response
     */
    public async createrefrenceSlider(Data: object, verifyUser: any) {

        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can create refrence Slider')
        }

        const newrefrenceSlider = await this.refrenceSliderRepository.create(Data)

        const refrenceSlider = await this.refrenceSliderRepository.save(newrefrenceSlider)

        if (!refrenceSlider) {
            return errorWithoutData('refrence Slider not created')
        }
        return successWithData("refrence Slider created successfully", refrenceSlider);

    }

    /**
     * Update an existing refrence Slider
     * @param id - The ID of the category to update
     * @param Data - Object containing updated category data
     * @returns Promise with success response or error response
     */
    public async updaterefrenceSlider(id: string, Data: { [key: string]: any }, verifyUser: any) {



        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can update refrence Slider')
        }

        const refrenceSlider = await this.refrenceSliderRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!refrenceSlider) {
            return errorWithoutData('refrence Slider not found')
        }

        if (refrenceSlider.image && Data.image) {
            const oldKey = refrenceSlider.image.split(".com/")[1];
            await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: oldKey }));
        }


        const updatedData = JSON.parse(JSON.stringify(Data));
        await this.refrenceSliderRepository.update(id.toString(), updatedData);
        return successWithoutData('refrence Slider updated successfully');

    }

    /**
     * Soft delete a refrence Slider
     * @param id - The ID of the category to delete
     * @returns Promise with success response or error response
     */

    public async deleterefrenceSlider(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("user cann't update attendance")
        }
        const refrenceSlider = await this.refrenceSliderRepository.findOneBy({ id });

        if (!refrenceSlider) {
            return errorWithoutData("Main event not found");
        }

        refrenceSlider.isDeleted = true; // Mark as soft deleted
        await this.refrenceSliderRepository.save(refrenceSlider);

        return successWithoutData("refrenceSlider soft deleted successfully");
    }
    public async activerefrenceSlider(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("user cann't update attendance")
        }
        const refrenceSlider = await this.refrenceSliderRepository.findOneBy({ id });

        if (!refrenceSlider) {
            return errorWithoutData("Event not found");
        }

        refrenceSlider.isActive = !refrenceSlider.isActive; // Mark as deleted
        await this.refrenceSliderRepository.save(refrenceSlider);

        return successWithoutData("refrenceSlider dectivetd successfully");
    }
}
