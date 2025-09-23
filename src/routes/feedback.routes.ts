import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { createFeedback, deleteFeedback, getFeedbackById, getFeedbackByUserId, getFeedbacks } from "../controllers/feedback.controller";
import { validateFeedback } from "../middlewares/feedback.validation";

const router = express.Router();

router.get("/all", verifyAccessToken, getFeedbacks);
router.get("/", verifyAccessToken, getFeedbackById);
router.get("/user", verifyAccessToken, getFeedbackByUserId);
router.post("/create", verifyAccessToken, validateFeedback, createFeedback);
router.delete("/delete/:id", verifyAccessToken, deleteFeedback);

export default router;  
