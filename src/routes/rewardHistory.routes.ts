import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { createRewardHistory, getRewardHistories, getRewardHistoryById, updateRewardHistory, deleteRewardHistory, getRewardHistoryByUserId, getRewardHistoryByUserIdTotal } from "../controllers/rewardHistory.controller";
import { validateRewardHistory, validateUpdateRewardHistory } from "../middlewares/rewardHistory.validation";
import { validateUserID } from "../middlewares/user.validation";
import { validateRequest } from "../middlewares/otp.validation";

const router = express.Router();

router.get("/all", verifyAccessToken, getRewardHistories);
router.get("/", verifyAccessToken, getRewardHistoryById);
router.get("/user", verifyAccessToken,getRewardHistoryByUserId);
router.get("/usertotal", verifyAccessToken, getRewardHistoryByUserIdTotal);
router.post("/create", verifyAccessToken, validateRewardHistory, validateRequest, createRewardHistory);
router.put("/update/:id", verifyAccessToken, validateUserID, validateUpdateRewardHistory, validateRequest, updateRewardHistory);
router.delete("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteRewardHistory);

export default router;