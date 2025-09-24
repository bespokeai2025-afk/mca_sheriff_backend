/**
 * Controller for handling admin related operations
 * Handles CRUD operations for admin users
 */

import { Request, Response } from "express";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { AdminService } from "../services/admin.service";

const adminService = new AdminService();


/**
 * Get all admin users
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON response with all admin users or error
 */
export const getAdmin = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user || !req.verifyUser) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const response = await adminService.findAdmin(req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Get an admin user by ID
 * @param req - Express request object with admin ID in params
 * @param res - Express response object
 * @returns JSON response with the admin user or error
 */
export const getAdminById = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user || !req.verifyUser) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const response = await adminService.findAdminById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Create a new admin user
 * @param req - Express request object with admin data in body
 * @param res - Express response object
 * @returns JSON response with the created admin user or error
 */
export const createAdmin = async (req: Request, res: Response): Promise<any> => {

    try {
        
        const response: any = await adminService.createAdmin(req.body);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Update an existing admin user
 * @param req - Express request object with admin ID in params and updated data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const updateAdmin = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user || !req.verifyUser) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const response = await adminService.updateAdmin(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Delete an admin user (soft delete)
 * @param req - Express request object with admin ID in params
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
export const deleteAdmin = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user || !req.verifyUser) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const response = await adminService.deleteAdmin(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const logoutAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        // Delete the user using the user service
        const response = await adminService.logoutAdmin(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const loginAdminWithEmailPassword = async (req: Request, res: Response): Promise<any> => {
      try {
        
        const response: any = await adminService.loginAdminWithEmailPassword(req.body);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
