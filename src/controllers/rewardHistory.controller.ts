import { Request, Response } from "express";
import { RewardHistoryService } from "../services/rewardHistory.service";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";

// Initialize the RewardHistoryService instance
const rewardHistoryService = new RewardHistoryService();

// Controller to get all reward histories
export const getRewardHistories = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await rewardHistoryService.findAllRewardHistories(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to get a specific reward history by ID
export const getRewardHistoryById = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await rewardHistoryService.findRewardHistoryById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to get a specific reward history by ID
export const getRewardHistoryByUserId = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await rewardHistoryService.findRewardHistoryByUserId(req.query.id as string, req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
// Controller to get a specific reward history by ID
export const getRewardHistoryByUserIdTotal = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await rewardHistoryService.findRewardHistoryByUserIdTotal(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to create a new reward history
export const createRewardHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await rewardHistoryService.createRewardHistory(req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to update an existing reward history
export const updateRewardHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await rewardHistoryService.updateRewardHistory(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to delete a reward history
export const deleteRewardHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await rewardHistoryService.deleteRewardHistory(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};