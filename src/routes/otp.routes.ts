import { getAllOtps, sendOtp } from "../controllers/otp.controller";
import { Router } from "express";
import { validateOtpRequest, validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = Router()


router.post('/send-otp', validateOtpRequest, validateRequest, sendOtp)
router.post('/getAllOtps',verifyAccessToken,getAllOtps)

export default router;
