import { Request, Response } from "express";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { UserService } from "../services/user.service";

// Initialize the UserService instance
const userService = new UserService();

// Controller to get all users
export const getUser = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const { pageSize, currentPage } = req.body;
        // Fetch all users using the user service
        const response = await userService.findUser(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to get a specific user by ID
export const getUserById = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        // Fetch the user by ID using the user service
        const response = await userService.findUserById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
// Controller to get a specific user by ID
export const getUserConfig = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        // Fetch the user by ID using the user service
        const response = await userService.findUserConfig(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to update an existing user
export const updateUser = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        // Update the user using the user service
        const response = await userService.updateUser(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to delete a user
export const deleteUser = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        // Delete the user using the user service
        const response = await userService.deleteUser(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const logoutUser = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        // Delete the user using the user service
        const response = await userService.logoutUser(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const verifyEmail = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Delete the user using the user service
        const response = await userService.verifyEmail(req.body.email, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const verifyEmailByLink = async (req: Request, res: Response): Promise<any> => {
    try {
        // Delete the user using the user service
        const response = await userService.verifyEmailByLink(req.params.id);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};