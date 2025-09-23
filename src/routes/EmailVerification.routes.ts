import { Router } from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { requestEmailVerification, verifyEmail } from "../controllers/emailVerification.controller";

const router = Router();

// Route to send verification email
router.post("/send-verification", verifyAccessToken, requestEmailVerification);

// Route to verify email using token
router.get("/verify-email", verifyEmail);

// Route to resend verification email
// router.post("/resend-verification", verifyAccessToken, resendVerificationEmail);

export default router;
