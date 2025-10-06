import express from "express";
import { validateUserID } from "../middlewares/user.validation";
import { validateOTP, validateOtpRequest, validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { validateAdmin } from "../middlewares/admin.validation";
import { createAdmin, deleteAdmin, getAdmin, getAdminById, logoutAdmin, updateAdmin, loginAdminWithEmailPassword,changePassword } from "../controllers/admin.controller";
import { sendOtpToAdmin, verifyOTPForAdmin } from "../controllers/otp.controller";

const router = express.Router();

router.get("/all", verifyAccessToken, getAdmin);
router.get("/", verifyAccessToken, getAdminById);
router.post("/create-admin",validateAdmin,validateRequest, createAdmin);
router.put("/update-admin/:id", verifyAccessToken,validateRequest, validateUserID, validateAdmin, validateRequest, updateAdmin);
router.delete("/delete-admin/:id", verifyAccessToken, validateUserID, validateRequest, deleteAdmin);

router.post("/send-otp", validateOtpRequest, validateRequest, sendOtpToAdmin);
router.post("/verify-otp", validateOTP, validateRequest, verifyOTPForAdmin);

router.post('/login',  loginAdminWithEmailPassword)
router.post('/logout/:id', verifyAccessToken, validateUserID, validateRequest, logoutAdmin)
router.post("/change-password/:id",verifyAccessToken,validateUserID,validateRequest,changePassword);
export default router;
