/**
 * Routes for main category operations
 * Defines API endpoints for CRUD operations on main categories
 */

import express from "express";

// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

// Import controller methods
import { activesurvey, createsurvey, deletesurvey, getsurvey, getsurveyById, updatesurvey,getSurveyqustionwithanswer } from "../controllers/survey_questions.controller";

// Import validation middleware
import { validatesurvey, validateUserID } from "../middlewares/survey_Questions.validation";

// Import file upload configuration
import upload from "../config/multerConfig";


// Create Express router
const router = express.Router();


// Get all main categories
router.get("/all", verifyAccessToken, getsurvey);
router.get("/questions", verifyAccessToken, getSurveyqustionwithanswer);



// Get a specific main category by ID
router.get("/", verifyAccessToken, getsurveyById);


// Create a new main category
router.post("/create", verifyAccessToken, validatesurvey, validateRequest, createsurvey);


// Update an existing main category
router.put("/update/:id", verifyAccessToken, validateUserID, validatesurvey, validateRequest, updatesurvey)


// Delete a main category
router.put("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deletesurvey);

router.put("/active/:id", verifyAccessToken, validateUserID, validateRequest, activesurvey);


export default router;
