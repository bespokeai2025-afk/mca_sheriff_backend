import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { validateCreateEventRegistration, validateUpdateEventRegistration } from "../middlewares/eventRegistration.validation";
import {
    registerUserForEvent,
    getAllRegistrations,
    getRegistrationById,
    cancelRegistration,
    deleteRegistration,
    getAllRegistrationsByEventId,
    getAllRegistrationsByEventIdUserId,
    getAllRegistrationsByUserId,
    getAllRegistrationsByUserIdWithattendance,
    getAllRegistrationIdsByUserId
} from "../controllers/eventRegistration.controller";
import { validateRequest } from "../middlewares/otp.validation";
import { validateUserID } from "../middlewares/user.validation";

const router = express.Router();

router.get("/all", verifyAccessToken, getAllRegistrations);
router.get("/event/", verifyAccessToken, getAllRegistrationsByEventId);
router.get("/eventbyuser", verifyAccessToken, getAllRegistrationsByEventIdUserId);
router.get("/eventbyuserwithattendance", verifyAccessToken, getAllRegistrationsByUserIdWithattendance);

router.get("/user", verifyAccessToken, getAllRegistrationsByUserId);
router.get("/registered-event/user", verifyAccessToken, getAllRegistrationIdsByUserId);
router.get("/", verifyAccessToken, getRegistrationById);

router.post("/register", verifyAccessToken, validateCreateEventRegistration, validateRequest, registerUserForEvent);

router.post("/cancel/:id", verifyAccessToken, validateUserID, validateRequest, cancelRegistration);

router.delete("/delete/:id", verifyAccessToken, deleteRegistration);

export default router;
