import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { validateAnswer } from "../middlewares/answer.validation";
import { createAnswer, deleteAnswer, getAnswerById, getAnswers, updateAnswer } from "../controllers/answer.controller";

const router = express.Router();

router.get("/all", verifyAccessToken, getAnswers);

router.get("/", verifyAccessToken, getAnswerById);
router.post("/create", verifyAccessToken, validateAnswer, createAnswer);
router.put("/update/:id", verifyAccessToken, validateAnswer, updateAnswer);
router.delete("/delete/:id", verifyAccessToken, deleteAnswer);

export default router;