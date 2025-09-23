/**
 * Controller for handling main category related operations
 * Handles CRUD operations for main onboardingSlidere
 */

import { Request, Response } from "express";
import { Multer } from "multer";

// Import utilities and services
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";
import { onboardingSliderService } from "../services/onboardingSlider.service";


// Initialize services and repositories
const onboardingSlidere = new onboardingSliderService();
const adminRepository = AppDataSource.getRepository(Admin);


/**
 * Get all main onboardingSlidere
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON response with all main onboardingSlidere or error
 */
export const getonboardingSlidere = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const { pageSize, currentPage } = req.body;

        const response = await onboardingSlidere.getOnboarding(req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getAllSliderWithoutToken = async (req: Request, res: Response): Promise<any> => {

    try {

        const response = await onboardingSlidere.getAllSliders();
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
export const getonboardingSlidereById = async (req: Request, res: Response): Promise<any> => {

    try {

        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await onboardingSlidere.findOnboardingById(req.query.id as string, req.verifyUser);
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
export const createonboardingSlidere = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const user = await adminRepository.findOneBy({ id: req.user.id });

        if (!user) {
            const response = errorWithoutData('Only admin can create a category');
            return res.status(response.result ? 200 : 400).json(response);
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const imageUrl = (req.file as Express.Multer.File & { location: string }).location;

        const data = { ...req.body, image: imageUrl };

        const response = await onboardingSlidere.createOnboarding(data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("Something went wrong", { error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};


/**
 * Update an existing main category
 * @param req - Express request object with category ID in params and updated data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const updateonboardingSlidere = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can update man onboardingSlidere');
            return res.status(response.result ? 200 : 400).json(response);
        }

        let data = req.body;
        if (req.file) {
            data.image = (req.file as Express.Multer.File & { location: string })?.location || null;

        } else {
            delete data.image;
        }

        const response: any = await onboardingSlidere.updateOnboarding(req.params.id, data, req.verifyUser);
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
export const deleteonboardingSlidere = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('Only admin can delete onboarding slider category');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await onboardingSlidere.deleteonboardingSlider(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
export const toggleOnboardingActiveController = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const user = await adminRepository.findOneBy({ id: req.user.id });
        if (!user) {
            const response = errorWithoutData('Only admin can update main category');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await onboardingSlidere.activeonboardingSlider(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};