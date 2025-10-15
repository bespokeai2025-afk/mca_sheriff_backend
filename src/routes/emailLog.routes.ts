// src/routes/email.routes.ts
import { Router } from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { EmailController } from "../controllers/emailLog.controller";

const router = Router();

router.post("/send-Email",verifyAccessToken, EmailController.sendEmail);

export default router;
