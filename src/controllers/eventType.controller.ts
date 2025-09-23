
import { Request, Response } from "express";
import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { Admin } from "../entities/Admin";
import { AppDataSource } from "../config/database";
const adminRepository = AppDataSource.getRepository(Admin);
import { EventsTypeService } from "../services/eventType.service";
const eventsTypeService = new EventsTypeService();
// Get all users
export const geteventType = async (req: Request, res: Response): Promise<any> => {
    try {
        const isActiveParam = req.body.isActive;
        let isActive: boolean | undefined;

        if (isActiveParam === "true") {
            isActive = true;
        } else if (isActiveParam === "false") {
            isActive = false;
        } else {
            isActive = undefined; // Fetch both active & inactive
        }

        // Extract pagination parameters from request body
        const { pageSize, currentPage } = req.body;

        // Call the service function with pagination
        const response = await eventsTypeService.geteventstype(
            isActive,
            parseInt(pageSize) || 50,  // Default to 50 items per page
            parseInt(currentPage) || 1, // Default to page 1
            req.verifyUser 
        );

        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return errorWithData('something went wrong', { error: error });
    }
};

// Get a user by ID
export const geteventTypeById = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await eventsTypeService.findeventstypeById(req.params.id)
        return res.status(response.result ? 200 : 400).json(response)

    } catch (error) {
        return errorWithData("something went wrong", { error: error });
    }
};

// Get a user by ID
export const createeventType = async (req: Request, res: Response): Promise<any> => {
    try {

        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('User is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }
        const data = { ...req.body, image: (req.file as Express.Multer.File & { location: string })?.location || null };

        const response = await eventsTypeService.createeventstype(data)
        return res.status(response.result ? 200 : 400).json(response)

    } catch (error) {
        return errorWithData("something went wrong", { error: error });
    }
};

// Update a user
export const updateeventType = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const user = await adminRepository.findOneBy({ id: req.user.id });

        if (!user) {
            const response = errorWithoutData('User is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }
        const data = { ...req.body, image: (req.file as Express.Multer.File & { location: string })?.location || null };

        // Ensure req.body is not undefined
        const response = await eventsTypeService.updateeventstype(req.params.id,data, req.verifyUser);

        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return errorWithData("something went wrong", { error: error });
    }
};


// Delete a user
export const deleteeventType = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('User is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }
        const response = await eventsTypeService.deleteeventstype(req.params.id, req.verifyUser)
        return res.status(response.result ? 200 : 400).json(response)

    } catch (error) {
        return errorWithData("something went wrong", { error: error });
    }
};


export const activeEventtype = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('User is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }
        const response = await eventsTypeService.activeEventtype(req.params.id, req.verifyUser)
        return res.status(response.result ? 200 : 400).json(response)

    } catch (error) {
        return errorWithData("something went wrong", { error: error });
    }
};
