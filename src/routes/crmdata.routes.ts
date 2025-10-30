import express from "express";
// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { validateExcelFile } from "../middlewares/validateExcelFile";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { verifyStaticToken } from "../middlewares/verifyStaticToken";
import { createCRMData, getCRMData, getUsercrmData, createCRMDataWithoutAuth, uploadCRMExcelFile,getCRMDataStatic, clearAllCRMData, clearAllCRMLeadData, deleteSelectedCRMLeadData } from "../controllers/CRMData.controller";
import { validatecrmdata, validateUserID } from "../middlewares/crmdata.validation";
import csvUpload from "../config/csvUpload"; 
// Import file upload configuration
import upload from "../config/multerConfig";

// Create Express router
const router = express.Router();
// Get all main categories
router.get("/start-batch-calling", verifyAccessToken, getCRMData);

router.get("/random-token-phone-call",verifyStaticToken, getCRMDataStatic);

router.post("/create", verifyAccessToken, validatecrmdata, validateRequest, createCRMData);
router.post("/create-without-auth", createCRMDataWithoutAuth);
router.post(
  "/upload-excel",
  csvUpload.single("file"), // multer in memory
  validateExcelFile,          // check file exists and type
  uploadCRMExcelFile              // controller
);

router.get("/get-crm-data", verifyAccessToken, getUsercrmData);
router.get("/ok", verifyAccessToken, getUsercrmData);

router.get("/clearAllDataForTesting",clearAllCRMData);

router.delete("/clear-all-crm-data", verifyAccessToken, clearAllCRMLeadData);

router.delete("/delete-selected-crm-data", verifyAccessToken, deleteSelectedCRMLeadData);

export default router;
