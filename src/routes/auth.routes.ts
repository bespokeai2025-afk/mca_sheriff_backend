import express from "express";
import { validateOTP, validateRequest } from "../middlewares/otp.validation";
import { verifyOTP } from "../controllers/otp.controller";
import { validateProfile } from "../middlewares/profile.validation";
// import { CompleteProfile } from "../controllers/profile.controller";
// import { validateUserReferralCode } from "../middlewares/userReferralCode.validation";
// import { VerifyReferralCode } from "../controllers/userReferralCode.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { refreshAccessToken } from "../controllers/auth.controller";


const router = express.Router();

router.post("/refresh-token", refreshAccessToken);

router.post('/verify-otp', validateOTP, validateRequest, verifyOTP)
// router.post('/complete-profile', verifyAccessToken, validateProfile, validateRequest, CompleteProfile)
// router.post('/verify-referral-code', verifyAccessToken, validateUserReferralCode, validateRequest, VerifyReferralCode)


export default router;
