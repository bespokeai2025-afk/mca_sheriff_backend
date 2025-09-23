import express from "express";
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { activeEvent, createEvent, deleteEvent,getEventsByType, getEvent, getEventById, getupcomingEvent, updateEvent, geteventsgroupedbytype } from "../controllers/event.controller";
import { validateEvent, validateEventUpdate } from "../middlewares/event.validation";
import uploadToS3 from "../config/multer";
import { validateUserID } from "../middlewares/user.validation";

const router = express.Router();

// Define a static folder structure
const upload = uploadToS3("events");

router.post("/all", verifyAccessToken, getEvent);
router.post("/upcoingevents", verifyAccessToken, getupcomingEvent);
router.get("/get_events_grouped_by_eventtype", verifyAccessToken, geteventsgroupedbytype);
router.get("/:id", verifyAccessToken, validateUserID, validateRequest, getEventById);
router.post('/get_by_eventype/:eventType',verifyAccessToken, getEventsByType);

router.post(
    "/create",
    verifyAccessToken,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "pdf", maxCount: 1 }
    ]),
    validateEvent,
    validateRequest,
    createEvent
);

router.put("/update/:id", verifyAccessToken,upload.fields([
    { name: "image", maxCount: 1 },
    { name: "pdf", maxCount: 1 }
]), validateEventUpdate, validateRequest, updateEvent);
router.put("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteEvent);
router.put("/active/:id", verifyAccessToken, validateUserID, validateRequest, activeEvent);

export default router;
