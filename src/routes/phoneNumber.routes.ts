import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { PhoneNumberController } from "../controllers/phoneNumber.controller";

const router = express.Router();

router.get("/get-allphonenumbers", verifyAccessToken, PhoneNumberController.getPhoneNumbers);

export default router;
