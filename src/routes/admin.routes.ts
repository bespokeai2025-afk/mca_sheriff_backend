import express from "express";
import { validateUserID } from "../middlewares/user.validation";
import { validateOTP, validateOtpRequest, validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { validateAdmin } from "../middlewares/admin.validation";
import { createAdmin, deleteAdmin, getAdmin, getAdminById, logoutAdmin, updateAdmin, loginAdminWithEmailPassword } from "../controllers/admin.controller";
import { sendOtpToAdmin, verifyOTPForAdmin } from "../controllers/otp.controller";

const router = express.Router();

router.get("/all", verifyAccessToken, getAdmin);
router.get("/", verifyAccessToken, getAdminById);
router.post("/create",  createAdmin);
router.put("/update/:id", verifyAccessToken, validateUserID, validateAdmin, validateRequest, updateAdmin);
router.delete("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteAdmin);

router.post("/send-otp", validateOtpRequest, validateRequest, sendOtpToAdmin);
router.post("/verify-otp", validateOTP, validateRequest, verifyOTPForAdmin);

router.post('/logout/:id', verifyAccessToken, validateUserID, validateRequest, logoutAdmin)
// router.post('/login',  loginAdminWithEmailPassword)
export default router;
