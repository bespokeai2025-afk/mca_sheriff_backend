/**
 * Routes for main category operations
 * Defines API endpoints for CRUD operations on main categories
 */

import express from "express";

// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

// Import controller methods
import { activeSurvey_answers, createSurvey_answers, deleteSurvey_answers, getSurvey_answers, getSurvey_answersById, updateSurvey_answers } from "../controllers/Survey_answers.controller";

// Import validation middleware
import { validateSurvey_answers, validateUserID } from "../middlewares/survey_Answers.validation";

// Import file upload configuration
import upload from "../config/multerConfig";


// Create Express router
const router = express.Router();


// Get all main categories
router.get("/all", verifyAccessToken, getSurvey_answers);


// Get a specific main category by ID
router.get("/", verifyAccessToken, getSurvey_answersById);


// Create a new main category
router.post("/create", verifyAccessToken, validateSurvey_answers, validateRequest, createSurvey_answers);


// Update an existing main category
router.put("/update/:id", verifyAccessToken, validateUserID, validateRequest, updateSurvey_answers)


// Delete a main category
router.put("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteSurvey_answers);

router.put("/active/:id", verifyAccessToken, validateUserID, validateRequest, activeSurvey_answers);


export default router;
