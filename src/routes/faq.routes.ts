/**
 * Routes for main category operations
 * Defines API endpoints for CRUD operations on main categories
 */

import express from "express";

// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

// Import controller methods
import { activefaq, createfaq, deletefaq, getfaq, getfaqById, updatefaq } from "../controllers/faq.controller";

// Import validation middleware
import { validatefaq, validateUserID } from "../middlewares/faq.validation";

// Import file upload configuration
import upload from "../config/multerConfig";


// Create Express router
const router = express.Router();


// Get all main categories
router.get("/all", verifyAccessToken, getfaq);


// Get a specific main category by ID
router.get("/", verifyAccessToken, getfaqById);


// Create a new main category
router.post("/create", verifyAccessToken, upload.single('image'), validatefaq, validateRequest, createfaq);


// Update an existing main category
router.put("/update/:id", verifyAccessToken, upload.single('image'), validateUserID, validatefaq, validateRequest, updatefaq)


// Delete a main category
router.put("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deletefaq);

router.put("/active/:id", verifyAccessToken, validateUserID, validateRequest, activefaq);


export default router;
