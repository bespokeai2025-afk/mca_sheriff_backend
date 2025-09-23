import { Request, Response } from "express";
import { FeedbackService } from "../services/feedback.service";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";

const feedbackService = new FeedbackService();

export const getFeedbacks = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await feedbackService.findFeedbacks(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getFeedbackById = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await feedbackService.findFeedbackById(req.query.id as string);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getFeedbackByUserId = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await feedbackService.findFeedbackByUserId(req.query.id as string);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const createFeedback = async (req: Request, res: Response): Promise<any> => {
    try {

        const response = await feedbackService.createFeedback(req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};


export const deleteFeedback = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await feedbackService.deleteFeedback(req.params.id);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('Something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};