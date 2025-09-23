/**
 * Service for handling main category business logic
 * Handles database operations and business rules for main categories
 */

import { MainCategory } from "../entities/MainCategory";
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


export class MainCategoryService {
    // Repository for main category database operations


    private mainCategoryRepository = AppDataSource.getRepository(MainCategory);

    /**
     * Get all active main categories
     * @returns Promise with success response containing categories or error response
     */
    public async getMainCategory(verifyUser: any, pageSize: number, currentPage: number) {
        let whereCondition = {};
    
        if (verifyUser.user_exist) {
            whereCondition = { isActive: true, isDeleted: false };
        }
    
        if (verifyUser.admin_exist) {
            whereCondition = { isDeleted: false };
        }
    
        const [mainCategories, totalItems] = await this.mainCategoryRepository.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize
        });
    
        const totalPages = Math.ceil(totalItems / pageSize);
    
        if (totalItems >= 1 && totalPages < currentPage) {
            return errorWithoutData("Page limit exceeded");
        }
    
        const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
    
        const formattedMainCategories = mainCategories.map(category => ({
            ...category,
            image: category.image && category.image.trim() !== ""
                ? category.image
                : `http://${process.env.LOCAL_DB_HOST}/uploads/categorytype.jpg`,
    
            logo: category.logo && category.logo.trim() !== ""
                ? category.logo
                : `http://${process.env.LOCAL_DB_HOST}/uploads/categorytype.jpg`
        }));
    
        return successWithData("all main categories", formattedMainCategories, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }
    

    /**
     * Find a main category by ID
     * @param id - The ID of the category to find
     * @returns Promise with success response containing the category or error response if not found
     */
    public async findMainCategoryById(id: string, verifyUser: any) {

        let mainCategory = null;
        if (verifyUser.admin_exist) {
            mainCategory = await this.mainCategoryRepository.findOne({ where: { id: id } })
        } else {
            mainCategory = await this.mainCategoryRepository.findOne({ where: { isActive: true, isDeleted: false, id: id } })
        }

        if (!mainCategory) {
            return errorWithoutData('main category not found')
        }

        return successWithData("main category found", mainCategory);
    }

    /**
     * Create a new main category
     * @param Data - Object containing category data
     * @returns Promise with success response containing the created category or error response
     */
    public async createMainCategory(Data: object, verifyUser: any) {

        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can create main category')
        }

        const newMainCategory = await this.mainCategoryRepository.create(Data)

        const mainCategory = await this.mainCategoryRepository.save(newMainCategory)

        if (!mainCategory) {
            return errorWithoutData('main category not created')
        }
        return successWithData("main category created successfully", mainCategory);

    }

    /**
     * Update an existing main category
     * @param id - The ID of the category to update
     * @param Data - Object containing updated category data
     * @returns Promise with success response or error response
     */
    public async updateMainCategory(id: string, Data: { [key: string]: any }, verifyUser: any) {



        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can update main category')
        }

        const mainCategory = await this.mainCategoryRepository.findOneBy({ id, isDeleted: false });
        if (!mainCategory) {
            return errorWithoutData('main category not found')
        }

        if (mainCategory.image && Data.image) {
            const oldKey = mainCategory.image.split(".com/")[1];
            await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: oldKey }));
        }


        const updatedData = JSON.parse(JSON.stringify(Data));
        await this.mainCategoryRepository.update(id.toString(), updatedData);
        return successWithoutData('main category updated successfully');

    }

    /**
     * Soft delete a main category
     * @param id - The ID of the category to delete
     * @returns Promise with success response or error response
     */
    public async deleteMainCategory(id: string, verifyUser: any) {


        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can delete main category')
        }
        const mainCategory = await this.mainCategoryRepository.findOneBy({ id, isActive: true, isDeleted: false })

        if (!mainCategory) {
            return errorWithoutData('main category not found')
        }

        if (mainCategory.image) {
            const imageKey = mainCategory.image.split(".com/")[1];
            await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: imageKey }));
        }


        mainCategory.isDeleted = true;
        mainCategory.isActive = false;


        await this.mainCategoryRepository.save(mainCategory);

        return successWithoutData("main category deleted Successfully")

    }

}
