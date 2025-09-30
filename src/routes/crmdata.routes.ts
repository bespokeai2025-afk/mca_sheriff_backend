import express from "express";
// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { createCRMData, getCRMData, getUsercrmData, createCRMDataWithoutAuth } from "../controllers/CRMData.controller";
import { validatecrmdata, validateUserID } from "../middlewares/crmdata.validation";
// Create Express router
const router = express.Router();
// Get all main categories
router.get("/start-batch-calling", verifyAccessToken, getCRMData);
router.post("/create", verifyAccessToken, validatecrmdata, validateRequest, createCRMData);
router.post("/create-without-auth", createCRMDataWithoutAuth);

router.get("/get-crm-data", verifyAccessToken, getUsercrmData);
router.get("/ok", verifyAccessToken, getUsercrmData);

export default router;
