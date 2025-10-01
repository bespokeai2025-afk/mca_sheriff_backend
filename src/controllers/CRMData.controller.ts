import { Request, Response } from "express";
// Import utilities and services
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { CRMDataService } from "../services/CRMData.service";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";

// Initialize services and repositories
const crmdataservice = new CRMDataService();
const adminRepository = AppDataSource.getRepository(Admin);
export const getCRMData = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const { pageSize, currentPage } = req.query;


        const response = await crmdataservice.getCRMData(req.verifyUser, parseInt(pageSize as string) || 50, parseInt(currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getUsercrmData = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const { pageSize, currentPage, mobile_number } = req.query;

        const response = await crmdataservice.getUsercrmData(
            req.verifyUser,
            parseInt(pageSize as string) || 50,
            parseInt(currentPage as string) || 1,
            mobile_number as string // optional filter
        );

        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("Something went wrong", { error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
export const createCRMData = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Ensure only admin can create CRM data
        const user = await adminRepository.findOneBy({ id: req.user.id });
        if (!user) {
            const response = errorWithoutData("Only admin can create CRM data");
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Prepare data
        const data = {
            ...req.body,
            image: (req.file as Express.Multer.File & { location: string })?.location || null
        };

        // Service handles both CRMData + CallOutputData
        const response = await crmdataservice.createCRMData(data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("Something went wrong", { error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
// export const createCRMDataWithoutAuth = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const data = {
//             ...req.body
//         };

//         const response = await crmdataservice.createCRMDataWithoutAuth(data);
//         return res.status(response.result ? 200 : 500).json(response);
//     } catch (error) {
//         const response = errorWithData("Something went wrong", error);
//         return res.status(500).json(response);
//     }
// };

export const createCRMDataWithoutAuth = async (req: Request, res: Response): Promise<any> => {
    try {
        const dataArray = req.body; // Expecting an array of objects

        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return res.status(400).json({ result: false, message: "Request body must be a non-empty array" });
        }

        const response = await crmdataservice.createCRMDataWithoutAuth(dataArray);
        return res.status(response.result ? 200 : 500).json(response);
    } catch (error) {
        const response = errorWithData("Something went wrong", error);
        return res.status(500).json(response);
    }
};




