import express from "express";
import { validateOTP, validateRequest } from "../middlewares/otp.validation";
import { verifyOTP } from "../controllers/otp.controller";
import { validateProfile } from "../middlewares/profile.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { refreshAccessToken } from "../controllers/auth.controller";


const router = express.Router();

router.post("/refresh-token", refreshAccessToken);

router.post('/verify-otp', validateOTP, validateRequest, verifyOTP)

export default router;
