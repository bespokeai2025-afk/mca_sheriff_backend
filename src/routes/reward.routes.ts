import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { validateReward, validateUpdateReward } from "../middlewares/reward.validation";
import { createReward, deleteReward, getRewardById, getRewards, updateReward } from "../controllers/reward.controller";
import { validateUserID } from "../middlewares/user.validation";
import { validateRequest } from "../middlewares/otp.validation";

const router = express.Router();

router.get("/all", verifyAccessToken, getRewards);
router.get("/", verifyAccessToken, getRewardById);
router.post("/create", verifyAccessToken, validateReward, validateRequest, createReward);
router.put("/update/:id", verifyAccessToken, validateUserID, validateUpdateReward, validateRequest, updateReward);
router.delete("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteReward);

export default router;