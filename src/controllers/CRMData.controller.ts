import { Request, Response } from "express";
import { Multer } from "multer";

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
export const createCRMData = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can create a faq');
            return res.status(response.result ? 200 : 400).json(response);
        }

        

        const data = { ...req.body, image: (req.file as Express.Multer.File & { location: string })?.location || null };

        const response = await crmdataservice.createCRMData(data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

