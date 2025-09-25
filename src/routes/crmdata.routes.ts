/**
 * Routes for main category operations
 * Defines API endpoints for CRUD operations on main categories
 */

import express from "express";

// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

// Import controller methods
import { createCRMData, getCRMData } from "../controllers/CRMData.controller";

// Import validation middleware
import { validatecrmdata, validateUserID } from "../middlewares/crmdata.validation";
// Create Express router
const router = express.Router();

// Get all main categories
router.get("/start-batch-calling", verifyAccessToken, getCRMData);

// Create a new main category
router.post("/create", verifyAccessToken, validatecrmdata, validateRequest, createCRMData);

export default router;
