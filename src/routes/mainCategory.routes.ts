/**
 * Routes for main category operations
 * Defines API endpoints for CRUD operations on main categories
 */

import express from "express";

// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

// Import controller methods
import { createMainCategory, deleteMainCategory, getMainCategory, getMainCategoryById, updateMainCategory } from "../controllers/mainCategory.controller";

// Import validation middleware
import { validateMainCategory, validateUpdateMainCategory, validateUserID } from "../middlewares/mainCategory.validation";

// Import file upload configuration
import upload from "../config/multerConfig";


// Create Express router
const router = express.Router();


// Get all main categories
router.get("/all", verifyAccessToken, getMainCategory);


// Get a specific main category by ID
router.get("/", verifyAccessToken, getMainCategoryById);


// Create a new main category
router.post("/create", verifyAccessToken, upload.single('image'), validateMainCategory, validateRequest, createMainCategory);


// Update an existing main category
router.put("/update/:id", verifyAccessToken, upload.single('image'), validateUserID, validateUpdateMainCategory, validateRequest, updateMainCategory)


// Delete a main category
router.delete("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteMainCategory);


export default router;
