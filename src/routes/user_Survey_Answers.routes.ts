import express from "express";

// Import middleware for authentication and validation
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

// Import controller methods
import { 
    getSurveyAnswers, 
    getSurveyAnswerById, 
    createSurveyAnswers, 
    updateSurveyAnswer, 
    deleteSurveyAnswer ,bulkCreateSurveyAnswers,getSurveyAnswersByUserId,getAllQuestionsWithAnswers
} from "../controllers/user_Survey_Answers.controller";

// Import validation middleware
import { validateUserSurveyAnswers, validateUserID } from "../middlewares/user_Survey_Answers.validation";

// Create Express router
const router = express.Router();

// Get all survey answers
router.get("/all", verifyAccessToken, getSurveyAnswers);
router.get("/bulkCreateSurveyAnswers", verifyAccessToken, bulkCreateSurveyAnswers);
router.get("/getAllQuestionsWithAnswers", verifyAccessToken, getAllQuestionsWithAnswers);
router.get("/get_by_user_id/:id", validateUserID, getSurveyAnswersByUserId);

// Get a specific survey answer by ID
router.get("/:id", verifyAccessToken, getSurveyAnswerById);

// Create a new survey answer
router.post("/create", verifyAccessToken, validateUserSurveyAnswers, validateRequest, createSurveyAnswers);

// Update an existing survey answer
router.put("/update/:id", verifyAccessToken, validateUserID, validateUserSurveyAnswers, validateRequest, updateSurveyAnswer);

// Delete a survey answer
router.put("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteSurveyAnswer);

export default router;
