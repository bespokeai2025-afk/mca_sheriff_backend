import { Request, Response } from "express";
import { RewardService } from "../services/reward.service";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";
import { Reward } from "../entities/Reward";
import { Not } from "typeorm";

// Initialize the RewardService instance
const rewardService = new RewardService();

// Get the repository for the Admin entity
const adminRepository = AppDataSource.getRepository(Admin);
const rewardRepository = AppDataSource.getRepository(Reward);

// Controller to get all rewards
export const getRewards = async (req: Request, res: Response): Promise<any> => {
    try {
        // Check if the user is authenticated
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Fetch the user from the database
        const user = await adminRepository.findOneBy({ id: req.user.id });

        // If user is not found, return an error response
        if (!user) {
            const response = errorWithoutData('User  is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Fetch all rewards using the reward service
        const response = await rewardService.findRewards(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to get a specific reward by ID
export const getRewardById = async (req: Request, res: Response): Promise<any> => {
    try {
        // Check if the user is authenticated
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Fetch the reward by ID using the reward service
        const response = await rewardService.findRewardById(req.query.id as string);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to create a new reward
export const createReward = async (req: Request, res: Response): Promise<any> => {
    try {
        // Check if the user is authenticated
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Fetch the user from the database
        const user = await adminRepository.findOneBy({ id: req.user.id });

        // If user is not found, return an error response
        if (!user) {
            const response = errorWithoutData('User  is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }

        if (req.body.name) {
            const name_exist = await rewardRepository.findOneBy({ name: req.body.name });
            if (name_exist) return res.status(400).json({ result: false, message: "name must be unique", data: [] })
        }

        // Create a new reward using the reward service
        const response = await rewardService.createReward(req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to update an existing reward
export const updateReward = async (req: Request, res: Response): Promise<any> => {
    try {
        // Check if the user is authenticated
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Fetch the user from the database
        const user = await adminRepository.findOneBy({ id: req.user.id });

        // If user is not found, return an error response
        if (!user) {
            const response = errorWithoutData('User  is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }

        let name_exist
        if (req.body.name) {
            name_exist = await rewardRepository.findOneBy({ name: req.body.name, id: Not(req.params.id) });
            console.log(name_exist);
        }
        
        if (name_exist) {
            return res.status(400).json({ result: false, message: "name must be unique", data: [] });
        }

        // Update the reward using the reward service
        const response = await rewardService.updateReward(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to delete a reward
export const deleteReward = async (req: Request, res: Response): Promise<any> => {
    try {
        // Check if the user is authenticated
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Fetch the user from the database
        const user = await adminRepository.findOneBy({ id: req.user.id });

        // If user is not found, return an error response
        if (!user) {
            const response = errorWithoutData('User  is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Delete the reward using the reward service
        const response = await rewardService.deleteReward(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData(' something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};