import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import {
    getAllAttendance,
    getAttendanceById,
    markAttendance,
    updateAttendance,
    revokeAttendance,
    deleteAttendance,
    getAttendanceByEventId,
    getAttendanceByEventIdByUserId,
    markAllAttendance,
    getAttendanceByUserId
} from "../controllers/eventAttendance.controller";
import { validateMarkAttendance, validateMarkAttendanceAll, validateUpdateAttendance } from "../middlewares/eventAttendance.validation";
import { validateUserID } from "../middlewares/user.validation";
import { validateRequest } from "../middlewares/otp.validation";

const router = express.Router();


router.get("/all", verifyAccessToken, getAllAttendance);
router.get("/", verifyAccessToken, getAttendanceById);
router.post("/mark", verifyAccessToken, validateMarkAttendance, validateRequest, markAttendance);
router.post("/markall", verifyAccessToken, validateMarkAttendanceAll, validateRequest, markAllAttendance);
router.put("/update/:id", verifyAccessToken, validateUserID, validateUpdateAttendance, validateRequest, updateAttendance);
router.put("/revoke/:id", verifyAccessToken, validateUserID, validateRequest, revokeAttendance);
router.delete("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteAttendance);


router.get("/event/", verifyAccessToken, getAttendanceByEventId);
router.get("/user/", verifyAccessToken, getAttendanceByUserId);
router.get("/eventbyuser/", verifyAccessToken, getAttendanceByEventIdByUserId);



export default router;