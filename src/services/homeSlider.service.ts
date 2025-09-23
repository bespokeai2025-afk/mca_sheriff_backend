/**
 * Service for handling Home Slider business logic
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
import { Home } from "../entities/HomeSlider";


export class HomeSliderService {
    // Repository for Home Slider database operations


    private HomeSlider = AppDataSource.getRepository(Home);

    /**
     * Get all active main categories
     * @returns Promise with success response containing categories or error response
     */
    public async getHome(verifyUser: any, pageSize: number, currentPage: number) {
        let whereCondition = {};
    
        if (verifyUser.user_exist) {
            whereCondition = { isActive: true, isDeleted: false };
        }
    
        if (verifyUser.admin_exist) {
            whereCondition = { isDeleted: false };
        }
    
        const [homeSliders, totalItems] = await this.HomeSlider.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize
        });
    
        const totalPages = Math.ceil(totalItems / pageSize);
    
        if (totalItems >= 1 && totalPages < currentPage) {  
            return errorWithoutData("Page limit exceeded");
        }
    
    
        const formattedHomeSliders = homeSliders.map(slider => ({
            ...slider,
            image: slider.image && slider.image.trim() !== ""
                ? slider.image
                : `http://${process.env.LOCAL_DB_HOST}/uploads/homebanner.png`
        }));
        
        return successWithData("all Home sliders", formattedHomeSliders, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }
    

    /**
     * Find a Home Slider by ID
     * @param id - The ID of the Homeslider to find
     * @returns Promise with success response containing the Homeslider or error response if not found
     */
    public async findHomeById(id: string, verifyUser: any) {

        let HomeSlider = null;
        if (verifyUser.admin_exist) {
            HomeSlider = await this.HomeSlider.findOne({ where: { id: id } })
        } else {
            HomeSlider = await this.HomeSlider.findOne({ where: { isActive: true, isDeleted: false, id: id } })
        }

        if (!HomeSlider) {
            return errorWithoutData('Home Slider not found')
        }

        return successWithData("Home Slider found", HomeSlider);
    }

    /**
     * Create a new Home Slider
     * @param Data - Object containing Homeslider data
     * @returns Promise with success response containing the created Homeslider or error response
     */
    public async createHome(Data: any, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can create Home Slider');
        }
    
        // Check if the priority already exists
       
    
        const newHomeSlider = await this.HomeSlider.create(Data);
        const HomeSlider = await this.HomeSlider.save(newHomeSlider);
    
        if (!HomeSlider) {
            return errorWithoutData('Home Slider not created');
        }
    
        return successWithData("Home Slider created successfully", HomeSlider);
    }
    

    /**
     * Update an existing Home Slider
     * @param id - The ID of the Homeslider to update
     * @param Data - Object containing updated Homeslider data
     * @returns Promise with success response or error response
     */
    public async updateHome(id: string, Data: { [key: string]: any }, verifyUser: any) {



        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can update Home Slider')
        }

        const HomeSlider = await this.HomeSlider.findOneBy({ id, isActive: true, isDeleted: false });
        if (!HomeSlider) {
            return errorWithoutData('Home Slider not found')
        }

        if (HomeSlider.image && Data.image) {
            const oldKey = HomeSlider.image.split(".com/")[1];
            await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: oldKey }));
        }


        const updatedData = JSON.parse(JSON.stringify(Data));
        await this.HomeSlider.update(id.toString(), updatedData);
        return successWithoutData('Home Slider updated successfully');

    }

    /**
     * Soft delete a Home Slider
     * @param id - The ID of the Homeslider to delete
     * @returns Promise with success response or error response
     */
    public async deleteHomeSlider(id: string, verifyUser: any) {


        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can delete Home Slider')
        }
        const HomeSlider = await this.HomeSlider.findOneBy({ id, isActive: true, isDeleted: false })

        if (!HomeSlider) {
            return errorWithoutData('Home Slider not found')
        }

        if (HomeSlider.image) {
            const imageKey = HomeSlider.image.split(".com/")[1];
            await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: imageKey }));
        }


        HomeSlider.isDeleted = true;
        HomeSlider.isActive = false;


        await this.HomeSlider.save(HomeSlider);

        return successWithoutData("Home Slider deleted Successfully")

    }
    public async activeHomeSlider(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can update main Homeslider');
        }
    
        const HomeSlider = await this.HomeSlider.findOneBy({ id, isDeleted: false });
        if (!HomeSlider) {
            return errorWithoutData('Main Homeslider not found');
        }
    
        
        HomeSlider.isActive = !HomeSlider.isActive;
        await this.HomeSlider.save(HomeSlider);
    
        return successWithoutData(`Main Homeslider deactivated successfully`);
    }
    

}
