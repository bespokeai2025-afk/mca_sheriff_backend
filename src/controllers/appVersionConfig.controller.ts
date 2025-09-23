// controllers/appVersionConfig.controller.ts
import { Request, Response } from "express";
import { AppVersionConfigService } from "../services/appVersionConfig.service";
import { errorWithData } from "../config/ApiResponse";

const appVersionConfigService = new AppVersionConfigService();

// Create App Version Config
export const createAppVersionConfig = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await appVersionConfigService.createAppVersionConfig(req.body);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {

        return res.status(500).json(errorWithData("Something went wrong", error));
    }
};

// Get All App Version Configs
export const getAllAppVersionConfigs = async (_req: Request, res: Response): Promise<any> => {
    try {
        const response = await appVersionConfigService.getAllAppVersionConfigs();
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};

export const systemundermaintanace = async (_req: Request, res: Response): Promise<any> => {
    try {
        const response = await appVersionConfigService.systemundermaintanace();
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};

export const getAppVersionConfigByAppVersion = async (req: Request, res: Response): Promise<any> => {
    try {
        // Convert app_version to a number
        const appVersion = Number(req.params.app_version);

        // Validate that it's a positive integer
        if (isNaN(appVersion) || appVersion <= 0) {
            return res.status(400).json(errorWithData("Invalid app version. Must be a positive number.", { app_version: req.params.app_version }));
        }

        // Call the service function
        const response = await appVersionConfigService.getAppVersionConfigByAppVersion(appVersion);

        // Return the appropriate status and response
        return res.status(response.result ? 200 : 404).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};



// Update App Version Config
export const updateAppVersionConfig = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await appVersionConfigService.updateAppVersionConfig(req.params.id, req.body);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};

// Delete App Version Config


// Soft Delete (isDeleted = true)
export const softDeleteAppVersionConfig = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await appVersionConfigService.softDeleteConfig(req.params.id);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};

// Toggle isActive Status
export const toggleAppConfigStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await appVersionConfigService.toggleConfigStatus(req.params.id);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return res.status(500).json(errorWithData("Something went wrong", { error }));
    }
};
