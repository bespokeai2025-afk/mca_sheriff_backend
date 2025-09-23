import { Request, Response } from "express";
import { ProfileService } from "../services/profile.service";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";

const profileService = new ProfileService();

// Controller to handle profile completion
export const CompleteProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mobile, name } = req.body;

        var response = await profileService.completeProfile(mobile, name, req.verifyUser);
    
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        // Fetch the user by ID using the user service
        const response = await profileService.findProfile(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};