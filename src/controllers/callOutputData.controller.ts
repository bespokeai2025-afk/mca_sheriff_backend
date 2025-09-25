import { Request, Response } from "express";
import { Multer } from "multer";
// Import utilities and services
import { errorWithData, errorWithoutData, successWithData } from "../config/ApiResponse";
import { callOutputDataService } from "../services/callOutputData.service";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";
// Initialize services and repositories
const calloutputdataservice = new callOutputDataService();
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
