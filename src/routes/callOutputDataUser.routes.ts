
import express from "express";
// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { createCallOutputData, deletefaq, getUsercallingData, updateCallOutputData } from "../controllers/callOutputData.controller";
import { validateCallOutputData, validateUserID } from "../middlewares/calloutputdata.validation";
// Create Express router
const router = express.Router();
router.get("/get-all-calldata", verifyAccessToken, getUsercallingData);
// router.post("/create", verifyAccessToken,  validateCallOutputData, validateRequest, createCallOutputData);
router.post("/create", createCallOutputData);
router.put("/update/:id", updateCallOutputData)
router.put("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deletefaq);

export default router;
