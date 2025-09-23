/**
 * Controller for handling Survey_answers related operations
 * Handles CRUD operations for main Survey_answers
 */

import { Request, Response } from "express";

// Import utilities and services
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { Survey_answersService } from "../services/survey_answers.service";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";


// Initialize services and repositories
const Survey_answersservice = new Survey_answersService();
const adminRepository = AppDataSource.getRepository(Admin);


/**
 * Get all main Survey_answers
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON response with all main Survey_answers or error
 */
export const getSurvey_answers = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const isActiveParam = req.query.isActive;
        let isActive: boolean | undefined;

        if (isActiveParam === "true") {
            isActive = true;
        } else if (isActiveParam === "false") {
            isActive = false;
        } else {
            isActive = undefined; // Fetch both active & inactive
        }
        const { pageSize, currentPage } = req.query;


        const response = await Survey_answersservice.getSurvey_answers(isActive, req.verifyUser, parseInt(pageSize as string) || 50, parseInt(currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Get a Survey_answers by ID
 * @param req - Express request object with Survey_answers ID in params
 * @param res - Express response object
 * @returns JSON response with the Survey_answers or error
 */
export const getSurvey_answersById = async (req: Request, res: Response): Promise<any> => {

    try {

        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await Survey_answersservice.findSurvey_answersById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Create a new Survey_answers
 * @param req - Express request object with Survey_answers data in body
 * @param res - Express response object
 * @returns JSON response with the created Survey_answers or error
 */
export const createSurvey_answers = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can create a Survey_answers');
            return res.status(response.result ? 200 : 400).json(response);
        }



        const data = { ...req.body};

        const response = await Survey_answersservice.createSurvey_answers(data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Update an existing Survey_answers
 * @param req - Express request object with Survey_answers ID in params and updated data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const updateSurvey_answers = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can update man Survey_answers');
            return res.status(response.result ? 200 : 400).json(response);
        }

        let data = req.body;
        if (req.file) {
            data.image = (req.file as Express.Multer.File & { location: string })?.location || null;

        } else {
            delete data.image;
        }

        const response: any = await Survey_answersservice.updateSurvey_answers(req.params.id, data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Delete a Survey_answers (soft delete)
 * @param req - Express request object with Survey_answers ID in params
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const deleteSurvey_answers = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('Only admin can delete Survey_answers');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await Survey_answersservice.deleteSurvey_answers(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
export const activeSurvey_answers = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('Only admin can deactivate Survey_answers');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await Survey_answersservice.activeSurvey_answers(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};