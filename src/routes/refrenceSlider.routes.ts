/**
 * Routes for main category operations
 * Defines API endpoints for CRUD operations on main categories
 */

import express from "express";

// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

// Import controller methods
import { activerefrenceSlider, createrefrenceSlider, deleterefrenceSlider, getrefrenceSlider, getrefrenceSliderById, updaterefrenceSlider } from "../controllers/referenceSlider.controller"

// Import validation middleware
import { validaterefrenceSlider, validateUserID } from "../middlewares/refrenceSlider.validation";

// Import file upload configuration
import upload from "../config/multerConfig";


// Create Express router
const router = express.Router();


// Get all main categories
router.get("/all", verifyAccessToken, getrefrenceSlider);


// Get a specific main category by ID
router.get("/", verifyAccessToken, getrefrenceSliderById);


// Create a new main category
router.post("/create", verifyAccessToken, upload.single('image'), validaterefrenceSlider, validateRequest, createrefrenceSlider);


// Update an existing main category
router.put("/update/:id", verifyAccessToken, upload.single('image'), validateUserID, validaterefrenceSlider, validateRequest, updaterefrenceSlider)


// Delete a main category
router.put("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleterefrenceSlider);

router.put("/active/:id", verifyAccessToken, validateUserID, validateRequest, activerefrenceSlider);


export default router;
