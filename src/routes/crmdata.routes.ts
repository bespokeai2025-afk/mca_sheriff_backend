import express from "express";
// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { validateExcelFile } from "../middlewares/validateExcelFile";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { createCRMData, getCRMData, getUsercrmData, createCRMDataWithoutAuth, uploadCRMExcel, getCalendlyAvailable } from "../controllers/CRMData.controller";
import { validatecrmdata, validateUserID } from "../middlewares/crmdata.validation";
import excelUpload from "../config/excelupload"; 
// Import file upload configuration
import upload from "../config/multerConfig";

// Create Express router
const router = express.Router();
// Get all main categories
router.get("/start-batch-calling", verifyAccessToken, getCRMData);

router.post("/create", verifyAccessToken, validatecrmdata, validateRequest, createCRMData);
router.post("/create-without-auth", createCRMDataWithoutAuth);
router.post(
  "/upload-excel",
  excelUpload.single("file"), // multer in memory
  validateExcelFile,          // check file exists and type
  uploadCRMExcel              // controller
);

router.get("/get-crm-data", verifyAccessToken, getUsercrmData);
router.get("/ok", verifyAccessToken, getUsercrmData);


export default router;
