/**
 * Controller for handling refrenceSlider related operations
 * Handles CRUD operations for main refrenceSlider
 */

import { Request, Response } from "express";
import { Multer } from "multer";

// Import utilities and services
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { refrenceSliderService } from "../services/refrenceslider.service";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";


// Initialize services and repositories
const refrencesliderservice = new refrenceSliderService();
const adminRepository = AppDataSource.getRepository(Admin);


/**
 * Get all main refrenceSlider
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON response with all main refrenceSlider or error
 */
export const getrefrenceSlider = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }


        const response = await refrencesliderservice.getrefrenceSlider(req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Get a refrenceSlider by ID
 * @param req - Express request object with refrenceSlider ID in params
 * @param res - Express response object
 * @returns JSON response with the refrenceSlider or error
 */
export const getrefrenceSliderById = async (req: Request, res: Response): Promise<any> => {

    try {

        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await refrencesliderservice.findrefrenceSliderById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Create a new refrenceSlider
 * @param req - Express request object with refrenceSlider data in body
 * @param res - Express response object
 * @returns JSON response with the created refrenceSlider or error
 */
export const createrefrenceSlider = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can create a refrenceSlider');
            return res.status(response.result ? 200 : 400).json(response);
        }

        

        const data = { ...req.body, image: (req.file as Express.Multer.File & { location: string })?.location || null };

        const response = await refrencesliderservice.createrefrenceSlider(data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Update an existing refrenceSlider
 * @param req - Express request object with refrenceSlider ID in params and updated data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const updaterefrenceSlider = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can update man refrenceSlider');
            return res.status(response.result ? 200 : 400).json(response);
        }

        let data = req.body;
        if (req.file) {
            data.image = (req.file as Express.Multer.File & { location: string })?.location || null;

        } else {
            delete data.image;
        }

        const response: any = await refrencesliderservice.updaterefrenceSlider(req.params.id, data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Delete a refrenceSlider (soft delete)
 * @param req - Express request object with refrenceSlider ID in params
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const deleterefrenceSlider = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('Only admin can delete refrenceSlider');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await refrencesliderservice.deleterefrenceSlider(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
export const activerefrenceSlider = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('Only admin can deactivate refrenceSlider');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await refrencesliderservice.activerefrenceSlider(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};