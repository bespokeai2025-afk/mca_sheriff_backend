/**
 * Controller for handling main category related operations
 * Handles CRUD operations for main categories
 */

import { Request, Response } from "express";
import { Multer } from "multer";

// Import utilities and services
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { MainCategoryService } from "../services/mainCategory.service";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";


// Initialize services and repositories
const mainCategoryService = new MainCategoryService();
const adminRepository = AppDataSource.getRepository(Admin);


/**
 * Get all main categories
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON response with all main categories or error
 */
export const getMainCategory = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const { pageSize, currentPage } = req.query;

        const response = await mainCategoryService.getMainCategory(req.verifyUser, parseInt(pageSize as string) || 50, parseInt(currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Get a main category by ID
 * @param req - Express request object with category ID in params
 * @param res - Express response object
 * @returns JSON response with the main category or error
 */
export const getMainCategoryById = async (req: Request, res: Response): Promise<any> => {

    try {

        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await mainCategoryService.findMainCategoryById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Create a new main category
 * @param req - Express request object with category data in body
 * @param res - Express response object
 * @returns JSON response with the created category or error
 */
export const createMainCategory = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can create a category');
            return res.status(response.result ? 200 : 400).json(response);
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const data = { ...req.body, image: (req.file as Express.Multer.File & { location: string })?.location || null };

        const response = await mainCategoryService.createMainCategory(data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Update an existing main category
 * @param req - Express request object with category ID in params and updated data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const updateMainCategory = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can update man categories');
            return res.status(response.result ? 200 : 400).json(response);
        }

        let data = req.body;
        if (req.file) {
            data.image = (req.file as Express.Multer.File & { location: string })?.location || null;

        } else {
            delete data.image;
        }

        const response: any = await mainCategoryService.updateMainCategory(req.params.id, data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Delete a main category (soft delete)
 * @param req - Express request object with category ID in params
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const deleteMainCategory = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('Only admin can delete main category');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await mainCategoryService.deleteMainCategory(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
