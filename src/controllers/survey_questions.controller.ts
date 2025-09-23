/**
 * Controller for handling survey related operations
 * Handles CRUD operations for main survey
 */

import { Request, Response } from "express";

// Import utilities and services
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { Survey_questions_Service } from "../services/survey_questions.service";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";


// Initialize services and repositories
const surveyservice = new Survey_questions_Service();
const adminRepository = AppDataSource.getRepository(Admin);


/**
 * Get all main survey
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON response with all main survey or error
 */
export const getsurvey = async (req: Request, res: Response): Promise<any> => {

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


        const response = await surveyservice.getSurvey_questions(isActive, req.verifyUser, parseInt(pageSize as string) || 50, parseInt(currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
export const getSurveyqustionwithanswer = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(400).json(response);
        }

        const isActiveParam = req.query.isActive;
        let isActive: boolean | undefined = undefined;
        if (isActiveParam === "true") isActive = true;
        else if (isActiveParam === "false") isActive = false;

        const { pageSize = 50, currentPage = 1 } = req.query;

        const response = await surveyservice.getSurvey_questions_withanswer(
            isActive, req.verifyUser, Number(pageSize), Number(currentPage)
        );
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("Something went wrong", { error });
        return res.status(500).json(response);
    }
};
/**
 * Get a survey by ID
 * @param req - Express request object with survey ID in params
 * @param res - Express response object
 * @returns JSON response with the survey or error
 */
export const getsurveyById = async (req: Request, res: Response): Promise<any> => {

    try {

        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await surveyservice.findSurvey_questionsById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Create a new survey
 * @param req - Express request object with survey data in body
 * @param res - Express response object
 * @returns JSON response with the created survey or error
 */
export const createsurvey = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can create a survey');
            return res.status(response.result ? 200 : 400).json(response);
        }



        const data = { ...req.body, image: (req.file as Express.Multer.File & { location: string })?.location || null };

        const response = await surveyservice.createSurvey_questions(data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Update an existing survey
 * @param req - Express request object with survey ID in params and updated data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const updatesurvey = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can update man survey');
            return res.status(response.result ? 200 : 400).json(response);
        }

        let data = req.body;
        if (req.file) {
            data.image = (req.file as Express.Multer.File & { location: string })?.location || null;

        } else {
            delete data.image;
        }

        const response: any = await surveyservice.updateSurvey_questions(req.params.id, data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Delete a survey (soft delete)
 * @param req - Express request object with survey ID in params
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const deletesurvey = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('Only admin can delete survey');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await surveyservice.deleteSurvey_questions(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
export const activesurvey = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('Only admin can deactivate survey');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await surveyservice.activeSurvey_questions(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};