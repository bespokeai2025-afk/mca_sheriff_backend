
import express from "express";
// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

// Import controller methods
import { createCallOutputData, deletefaq, getUsercallingData, updateCallOutputData } from "../controllers/callOutputData.controller";

// Import validation middleware
import { validateCallOutputData, validateUserID } from "../middlewares/calloutputdata.validation";

// Import file upload configuration
import upload from "../config/multerConfig";


// Create Express router
const router = express.Router();


// Get all main categories
router.get("/get-all-calldata", verifyAccessToken, getUsercallingData);

// ftrgvrtgrttbtb5ty


// Create a new main category
// 
// router.post("/create", verifyAccessToken,  validateCallOutputData, validateRequest, createCallOutputData);
router.post("/create", createCallOutputData);

// Update an existing main category
router.put("/update/:id", updateCallOutputData)


// Delete a main category
router.put("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deletefaq);


export default router;
