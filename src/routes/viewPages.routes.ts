import express from "express";
import { deleteUser, getUser, getUserById, getUserConfig, logoutUser, updateUser } from "../controllers/user.controller";
import { validateRequest } from "../middlewares/otp.validation";
import { validateUser, validateUserID } from "../middlewares/user.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.get('/privacy-policy', (req, res) => {
    res.render('privacyPolicy', {
        appName: "Your App Name",
        effectiveDate: "March 26, 2025",
        contactEmail: "support@yourapp.com",
        contactPhone: "+1234567890",
        delete_acc_link : "https://"
    });
})
router.get('/terms-and-condition', (req, res) => {
    res.render('termsAndCondition',  { 
        appName: "Your App Name", 
        effectiveDate: "March 26, 2025", 
        contactEmail: "support@yourapp.com",
        contactPhone: "+1234567890"
    });
})


export default router;
