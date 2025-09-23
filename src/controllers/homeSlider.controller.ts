/**
 * Controller for handling main Homeslider related operations
 * Handles CRUD operations for main Homeslider
 */

import { Request, Response } from "express";
import { Multer } from "multer";

// Import utilities and services
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";
import { HomeSliderService } from "../services/homeSlider.service";


// Initialize services and repositories
const Homeslidere = new HomeSliderService();
const adminRepository = AppDataSource.getRepository(Admin);


/**
 * Get all main Homeslider
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON response with all main Homeslider or error
 */
export const getHomeslidere = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const { pageSize, currentPage } = req.query;


        const response = await Homeslidere.getHome(req.verifyUser, parseInt(pageSize as string) || 50, parseInt(currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Get a main Homeslider by ID
 * @param req - Express request object with Homeslider ID in params
 * @param res - Express response object
 * @returns JSON response with the main Homeslider or error
 */
export const getHomeslidereById = async (req: Request, res: Response): Promise<any> => {

    try {

        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await Homeslidere.findHomeById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Create a new main Homeslider
 * @param req - Express request object with Homeslider data in body
 * @param res - Express response object
 * @returns JSON response with the created Homeslider or error
 */
export const createHomeslidere = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const user = await adminRepository.findOneBy({ id: req.user.id });

        if (!user) {
            const response = errorWithoutData('Only admin can create a Homeslider');
            return res.status(response.result ? 200 : 400).json(response);
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const imageUrl = (req.file as Express.Multer.File & { location: string }).location;

        const data = { ...req.body, image: imageUrl };

        const response = await Homeslidere.createHome(data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("Something went wrong", { error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};


/**
 * Update an existing main Homeslider
 * @param req - Express request object with Homeslider ID in params and updated data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const updateHomeslidere = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can update man Homeslider');
            return res.status(response.result ? 200 : 400).json(response);
        }

        let data = req.body;
        if (req.file) {
            data.image = (req.file as Express.Multer.File & { location: string })?.location || null;

        } else {
            delete data.image;
        }

        const response: any = await Homeslidere.updateHome(req.params.id, data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Delete a main Homeslider (soft delete)
 * @param req - Express request object with Homeslider ID in params
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const deleteHomeslidere = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('Only admin can delete main Homeslider');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await Homeslidere.deleteHomeSlider(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
export const toggleHomeActiveController = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const user = await adminRepository.findOneBy({ id: req.user.id });
        if (!user) {
            const response = errorWithoutData('Only admin can update main Homeslider');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await Homeslidere.activeHomeSlider(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};