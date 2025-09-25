import { Request, Response } from "express";
import { Multer } from "multer";
// Import utilities and services
import { errorWithData, errorWithoutData, successWithData } from "../config/ApiResponse";
import { callOutputDataService } from "../services/callOutputData.service";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";
// Initialize services and repositories
const calloutputdataservice = new callOutputDataService();
const userhistoryservice = new callOutputDataService();
const adminRepository = AppDataSource.getRepository(Admin);

export const getUsercallingData = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const { pageSize, currentPage } = req.query;


        const response = await calloutputdataservice.getUsercallingData(req.verifyUser, parseInt(pageSize as string) || 50, parseInt(currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};


export const getUsercallingHistory = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const { pageSize, currentPage } = req.query;


        const response = await calloutputdataservice.getUsercallingHistory(req.verifyUser, parseInt(pageSize as string) || 50, parseInt(currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

export const getUserCallDataCount = async (req: Request, res: Response): Promise<any> => {
    try {
        const verifyUser = req.user; // assume auth middleware sets this
        if (!verifyUser) {
            return res.status(401).json(errorWithoutData("Unauthorized"));
        }

        // Parse pagination query params
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const currentPage = parseInt(req.query.currentPage as string) || 1;

        // Call service
        const result = await calloutputdataservice.getUserCallDataCount(verifyUser, pageSize, currentPage);

        // Send the service response directly
        return res.status(200).json(result);

    } catch (error) {
        console.error(" Error in getUserCallData controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            data: { error: (error as Error).message }
        });
    }
};

export const createCallOutputData = async (req: Request, res: Response): Promise<void> => {
  try {
    // 🔍 Log the full request body
    console.log("👉 Incoming Request Body:", req.body, null, 2);

    // 🔍 If you only care about raw_data
    if (req.body.raw_data) {
      console.log("👉 Raw Data Payload:", req.body.raw_data);
    }

    const response = await calloutputdataservice.createCallOutputData(req.body);

    // 🔍 Log service response before sending
    console.log("✅ Service Response:", response);

    res.status(response.result ? 200 : 400).json(response);
  } catch (error) {
    console.error("❌ Error creating call output data:", error);

    const response = errorWithData("Something went wrong", { error });
    res.status(400).json(response);
  }
};
export const updateCallOutputData = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('only admin can update call output data ');
            return res.status(response.result ? 200 : 400).json(response);
        }

        let data = req.body;
        // if (req.file) {
        //     data.image = (req.file as Express.Multer.File & { location: string })?.location || null;

        // } else {
        //     delete data.image;
        // }

        const response: any = await calloutputdataservice.updateCallOutputData(req.params.id, data, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
export const deletefaq = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('Only admin can delete faq');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await calloutputdataservice.deletefaq(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
