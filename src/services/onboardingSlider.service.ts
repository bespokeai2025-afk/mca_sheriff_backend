/**
 * Service for handling onboarding Slider business logic
 * Handles database operations and business rules for main categories
 */

import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import path from "path";

// Import AWS S3 related dependencies
import fs from 'fs';
import s3 from "../config/s3Bucket";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { User } from "../entities/User";
import { Admin } from "../entities/Admin";
import { deleteUserToken } from "../utils/jwtUtils";
import { Onboarding } from "../entities/OnboardingSlider";


export class onboardingSliderService {
    // Repository for onboarding Slider database operations


    private onboardingSlider = AppDataSource.getRepository(Onboarding);

    /**
     * Get all active main categories
     * @returns Promise with success response containing categories or error response
     */
    public async getOnboarding(verifyUser: any) {


        let whereCondition = {};
        if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false };
    }

    if (verifyUser.admin_exist) {
        whereCondition = { isDeleted: false };
    }

        const [mainCategories] = await this.onboardingSlider.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' }
        });


        // if( totalItems >= 1 && totalPages < currentPage){
        //     return errorWithoutData("Page limit exceeded")
        // }

        return successWithData("all onboarding sliders", mainCategories);

    }
    public async getAllSliders() {

        const whereCondition = { isActive: true, isDeleted: false };
      
      const [mainCategories] = await this.onboardingSlider.findAndCount({
        where: whereCondition,
        order: { createdAt: 'DESC' },
      });
        // if( totalItems >= 1 && totalPages < currentPage){
        //     return errorWithoutData("Page limit exceeded")
        // }

        return successWithData("all onboardingSliders", mainCategories);

    }
    /**
     * Find a onboarding Slider by ID
     * @param id - The ID of the Onboarding to find
     * @returns Promise with success response containing the Onboarding or error response if not found
     */
    public async findOnboardingById(id: string, verifyUser: any) {

        let onboardingSlider = null;
        if (verifyUser.admin_exist) {
            onboardingSlider = await this.onboardingSlider.findOne({ where: { id: id } })
        } else {
            onboardingSlider = await this.onboardingSlider.findOne({ where: { isActive: true, isDeleted: false, id: id } })
        }

        if (!onboardingSlider) {
            return errorWithoutData('onboarding Slider not found')
        }

        return successWithData("onboarding Slider found", onboardingSlider);
    }

    /**
     * Create a new onboarding Slider
     * @param Data - Object containing Onboarding data
     * @returns Promise with success response containing the created Onboarding or error response
     */
    public async createOnboarding(Data: any, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can create onboarding Slider');
        }
    
   
    
        const newonboardingSlider = await this.onboardingSlider.create(Data);
        const onboardingSlider = await this.onboardingSlider.save(newonboardingSlider);
    
        if (!onboardingSlider) {
            return errorWithoutData('Onboarding Slider not created');
        }
    
        return successWithData("Onboarding Slider created successfully", onboardingSlider);
    }
    

    /**
     * Update an existing onboarding Slider
     * @param id - The ID of the Onboarding to update
     * @param Data - Object containing updated Onboarding data
     * @returns Promise with success response or error response
     */
    public async updateOnboarding(id: string, Data: { [key: string]: any }, verifyUser: any) {



        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can update onboarding Slider')
        }

        const onboardingSlider = await this.onboardingSlider.findOneBy({ id, isActive: true, isDeleted: false });
        if (!onboardingSlider) {
            return errorWithoutData('onboarding Slider not found')
        }

        if (onboardingSlider.image && Data.image) {
            const oldKey = onboardingSlider.image.split(".com/")[1];
            await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: oldKey }));
        }


        const updatedData = JSON.parse(JSON.stringify(Data));
        await this.onboardingSlider.update(id.toString(), updatedData);
        return successWithoutData('onboarding Slider updated successfully');

    }

    /**
     * Soft delete a onboarding Slider
     * @param id - The ID of the Onboarding to delete
     * @returns Promise with success response or error response
     */
    public async deleteonboardingSlider(id: string, verifyUser: any) {


        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can delete onboarding Slider')
        }
        const onboardingSlider = await this.onboardingSlider.findOneBy({ id, isActive: true, isDeleted: false })

        if (!onboardingSlider) {
            return errorWithoutData('onboarding Slider not found')
        }

        if (onboardingSlider.image) {
            const imageKey = onboardingSlider.image.split(".com/")[1];
            await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: imageKey }));
        }


        onboardingSlider.isDeleted = true;
        onboardingSlider.isActive = false;


        await this.onboardingSlider.save(onboardingSlider);

        return successWithoutData("onboarding Slider deleted Successfully")

    }
    public async activeonboardingSlider(id: string,verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can update main Onboarding');
        }
    
        const onboardingSlider = await this.onboardingSlider.findOneBy({ id, isDeleted: false });
        if (!onboardingSlider) {
            return errorWithoutData('Main Onboarding not found');
        }
           
        onboardingSlider.isActive = !onboardingSlider.isActive;

        await this.onboardingSlider.save(onboardingSlider);
    
        return successWithoutData(`Main Onboarding  'activated'  successfully`);
    }
    

}
