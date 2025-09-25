/**
 * Routes for main category operations
 * Defines API endpoints for CRUD operations on main categories
 */

import express from "express";

// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

// Import controller methods
import { activefaq, createCallOutputData, deletefaq, getUsercallingData, getfaqById, updateCallOutputData } from "../controllers/callOutputData.controller";

// Import validation middleware
import { validateCallOutputData, validateUserID } from "../middlewares/calloutputdata.validation";

// Import file upload configuration
import upload from "../config/multerConfig";


// Create Express router
const router = express.Router();


// Get all main categories
router.get("/all", verifyAccessToken, getUsercallingData);


// Get a specific main category by ID
router.get("/", verifyAccessToken, getfaqById);


// Create a new main category
router.post("/create", verifyAccessToken, upload.single('image'), validateCallOutputData, createCallOutputData);


// Update an existing main category
router.put("/update/:id", verifyAccessToken, upload.single('image'), validateUserID, validateCallOutputData, validateRequest, updateCallOutputData)


// Delete a main category
router.put("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deletefaq);

router.put("/active/:id", verifyAccessToken, validateUserID, validateRequest, activefaq);


export default router;
