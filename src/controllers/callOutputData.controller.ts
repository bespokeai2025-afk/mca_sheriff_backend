/**
 * Controller for handling faq related operations
 * Handles CRUD operations for main faq
 */

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


/**
 * Get all main faq
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON response with all main faq or error
 */
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

/**
 * Get a faq by ID
 * @param req - Express request object with faq ID in params
 * @param res - Express response object
 * @returns JSON response with the faq or error
 */
export const getfaqById = async (req: Request, res: Response): Promise<any> => {

    try {

        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await calloutputdataservice.findfaqById(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

/**
 * Create a new faq
 * @param req - Express request object with faq data in body
 * @param res - Express response object
 * @returns JSON response with the created faq or error
 */
// export const createCallOutputData = async (req: Request, res: Response): Promise<any> => {

//     try {
//     //     //if (!req.user) {
//     //         const response = errorWithoutData("Authentication failed");
//     //         return res.status(response.result ? 200 : 400).json(response);
//     //    // }
//     //     const user = await adminRepository.findOneBy({ id: req.user.id })

//     //     if (!user) {
//     //         const response = errorWithoutData('only admin can create a faq');
//     //         return res.status(response.result ? 200 : 400).json(response);
//     //     }

        

//         const data = { ...req.body};

//         const response = await calloutputdataservice.createCallOutputData(data);
//         return res.status(response.result ? 200 : 400).json(response);
//     } catch (error) {
//         const response = errorWithData("something went wrong", { error: error });
//         return res.status(response.result ? 200 : 400).json(response);
//     }
// };
export const createCallOutputData = async (req: Request, res: Response): Promise<void> => {
  try {
    // 🔍 Log the full request body
    console.log("👉 Incoming Request Body:", JSON.stringify(req.body, null, 2));

    // 🔍 If you only care about raw_data
    if (req.body.raw_data) {
      console.log("👉 Raw Data Payload:", JSON.stringify(req.body.raw_data, null, 2));
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

/**
 * Update an existing faq
 * @param req - Express request object with faq ID in params and updated data in body
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
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

/**
 * Delete a faq (soft delete)
 * @param req - Express request object with faq ID in params
 * @param res - Express response object
 * @returns JSON response with success message or error
 */
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
export const activefaq = async (req: Request, res: Response): Promise<any> => {

    try {
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id })

        if (!user) {
            const response = errorWithoutData('Only admin can deactivate faq');
            return res.status(response.result ? 200 : 400).json(response);
        }

        const response = await calloutputdataservice.activefaq(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData("something went wrong", { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};