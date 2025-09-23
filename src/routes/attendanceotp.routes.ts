import { getAllAttendanceOtps, sendAttendanceOtp,verifyAttendanceOTP } from "../controllers/attendanceotp.controller";
import { Router } from "express";
import { validateOtpRequest, validateRequest ,validateOTP} from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = Router()


router.post('/sendAttendance-otp', validateOtpRequest, validateRequest, sendAttendanceOtp)
router.post('/getAllAttendanceOtps', verifyAccessToken, getAllAttendanceOtps)
router.post('/verifyAttendance-otp', validateOTP, validateRequest, verifyAttendanceOTP)

export default router;
