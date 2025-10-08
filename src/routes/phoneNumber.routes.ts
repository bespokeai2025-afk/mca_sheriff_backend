import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { PhoneNumberController } from "../controllers/phoneNumber.controller";

const router = express.Router();

router.post("/update-phonenumbersfrom-retell", verifyAccessToken, PhoneNumberController.saveSelectedPhoneNumber);


router.get("/get-allphonenumbersfrom-retell", verifyAccessToken, PhoneNumberController.getPhoneNumbers);

export default router;
