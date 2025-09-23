import { Request, Response } from "express";
import { UserSurveyAnswersService } from "../services/user_Survey_Answers.service";
import { errorWithData, errorWithoutData, successWithData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";

// Initialize services and repositories
const userSurveyAnswersService = new UserSurveyAnswersService();
const adminRepository = AppDataSource.getRepository(Admin);

/**
 * Get all survey answers
 */


export const bulkCreateSurveyAnswers = async (req: Request, res: Response): Promise<any> => {
    try {
        const { user_id, responses } = req.body;

        if (!user_id || !Array.isArray(responses) || responses.length === 0) {
            return res.status(400).json(errorWithoutData("Invalid request payload"));
        }

        const response = await userSurveyAnswersService.createBulkSurveyAnswers(user_id, responses);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};
// export const getSurveyAnswers = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const response = await userSurveyAnswersService.getSurveyAnswers();
//         return res.status(response.result ? 200 : 400).json(response);
//     } catch (error) {
//         return res.status(500).json(errorWithData("Something went wrong", { error }));
//     }
// };
export const getSurveyAnswers = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const { pageSize, currentPage } = req.query;

        const response = await userSurveyAnswersService.getSurveyAnswers(req.verifyUser, parseInt(pageSize as string) || 50, parseInt(currentPage as string) || 1);



        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};


/**
 * Get a single survey answer by ID
 */
export const getSurveyAnswerById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const response = await userSurveyAnswersService.getSurveyAnswerById(id);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};

/**
 * Create a new survey answer
 */
export const createSurveyAnswers = async (req: Request, res: Response): Promise<any> => {
    try {
        const { user_id: userId, responses } = req.body;

        if (!userId || !responses || !Array.isArray(responses)) {
            return res.status(400).json(errorWithData("Invalid request body", { userId, responses }));
        }

        const response = await userSurveyAnswersService.createSurveyAnswers(userId, responses);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};


/**
 * Update a survey answer
 */
export const updateSurveyAnswer = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { answerId } = req.body;

        const response = await userSurveyAnswersService.updateSurveyAnswer(id, answerId);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};

/**
 * Delete a survey answer
 */
export const deleteSurveyAnswer = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const response = await userSurveyAnswersService.deleteSurveyAnswer(id);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};
export const getSurveyAnswersByUserId = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id: userId } = req.params;

        const response = await userSurveyAnswersService.getSurveyAnswersByUserId(userId);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};

export const getAllQuestionsWithAnswers = async (req: Request, res: Response): Promise<any> => {
    try {

        const response = await userSurveyAnswersService.getAllQuestionsWithAnswers();
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};