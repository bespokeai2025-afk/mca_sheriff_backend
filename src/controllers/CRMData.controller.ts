import { Request, Response } from "express";
import multer from 'multer';
import XLSX from "xlsx";
import path from "path";
import fs from 'fs';
import { Multer } from "multer";

// Import utilities and services
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { CRMDataService } from "../services/CRMData.service";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";
const upload = multer({ dest: 'uploads/' });
// Initialize services and repositories
const crmdataservice = new CRMDataService();
const adminRepository = AppDataSource.getRepository(Admin);
export const getCRMData = async (req: Request, res: Response): Promise<any> => {

  try {
    if (!req.user) {
      const response = errorWithoutData("Authentication failed");
      res.status(response.result ? 200 : 400).json(response);
      return; // ✅ exit without returning Response
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
    // Authentication check
    if (!req.user) {
      const response = errorWithoutData("Authentication failed");
      return res.status(response.result ? 200 : 400).json(response);
    }

    // Optional mobile number filter
    const mobile_number = req.query.mobile_number as string | undefined;

    // Call service
    const response = await crmdataservice.getUsercrmData(
      req.verifyUser,
      mobile_number
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

export const createCRMDataWithoutAuth = async (req: Request, res: Response): Promise<any> => {
  try {
    const dataArray = req.body; // Expecting an array of objects

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return res
        .status(400)
        .json({ result: false, message: "Request body must be a non-empty array" });
    }

    const response = await crmdataservice.createCRMDataWithoutAuth(dataArray);
    return res.status(response.result ? 200 : 500).json(response);

  } catch (error) {
    const response = errorWithData("Something went wrong", error);
    return res.status(500).json(response);
  }
};
export const uploadCRMExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        result: false,
        statuscode: 400,
        message: "No file uploaded",
      });
      return;
    }

    // Read Excel buffer
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!data.length) {
      res.status(400).json({
        result: false,
        statuscode: 400,
        message: "Uploaded Excel file is empty",
      });
      return;
    }

    // Call service with data + filename
    const result = await CRMDataService.insertCRMData(data, req.file.originalname);

    res.status(200).json({
      result: true,
      statuscode: 200,
      message: result.message,
      summary: {
        insertedCount: result.data.insertedCount,
        updatedCount: result.data.updatedCount,
        failedCount: result.data.failedCount,
      },
      insertedRecords: result.data.insertedRecords.map((record: any) => ({
        name: record.name,
        mobile_number: record.mobile_number,
        email: record.email,
        lead_id: record.lead_id,
        need_to_call: record.need_to_call,
      })),
      updatedRecords: result.data.updatedRecords.map((record: any) => ({
        name: record.name,
        mobile_number: record.mobile_number,
        email: record.email,
        lead_id: record.lead_id,
        need_to_call: record.need_to_call,
      })),
      failedRecords: result.data.failedRecords || [],
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);

    res.status(500).json({
      result: false,
      statuscode: 500,
      message: "Failed to process Excel file",
      error: errMsg,
    });
  }
};

// export const createCRMDataWithoutAuth = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const dataArray = req.body; // Expecting an array of objects

//         if (!Array.isArray(dataArray) || dataArray.length === 0) {
//             return res.status(400).json({ result: false, message: "Request body must be a non-empty array" });
//         }

//         const response = await crmdataservice.createCRMDataWithoutAuth(dataArray);
//         return res.status(response.result ? 200 : 500).json(response);

//     } catch (error) {
//         const response = errorWithData("Something went wrong", error);
//         return res.status(500).json(response);
//     }
// };
// export const uploadCRMExcel = async (req: Request, res: Response): Promise<void> => {
//   try {
//     if (!req.file) {
//       res.status(400).json({ result: false, message: "No file uploaded" });
//       return;
//     }

//     const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

//     // Pass file name as second argument
//     const result = await CRMDataService.insertCRMData(data, req.file.originalname);

//     res.status(200).json({
//       result: true,
//       statuscode: 200,
//       message: result.message,
//       data: result.data.insertedRecords.map((record: any) => ({
//         name: record.name,
//         mobile_number: record.mobile_number,
//         email: record.email,
//         lead_id: record.lead_id,
//         need_to_call: record.need_to_call,
//       })),
//       skippedLeadIds: result.data.skippedLeadIds,
//       insertedCount: result.data.insertedRecords.length,
//     });
//   } catch (error: unknown) {
//     console.error("Upload error:", error);
//     const errMsg = error instanceof Error ? error.message : String(error);
//     res.status(500).json({
//       result: false,
//       statuscode: 500,
//       message: "Failed to process Excel file",
//       error: errMsg,
//     });
//   }
// };







