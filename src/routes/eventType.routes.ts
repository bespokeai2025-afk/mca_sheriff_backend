import express from "express";
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { activeEventtype, createeventType, deleteeventType, geteventType, geteventTypeById, updateeventType } from "../controllers/eventType.controller";
import { validateCreateEventType, validateUpdateEventType } from "../middlewares/eventType.validation";
import { validateUserID } from "../middlewares/user.validation";
import uploadImageToS3 from "../config/uploadiamges";

const router = express.Router();

router.post("/all", verifyAccessToken, geteventType);
router.get("/:id", verifyAccessToken, validateUserID, validateRequest, geteventTypeById);

router.post(
    "/create",
    verifyAccessToken,
    uploadImageToS3("eventtype", 500 * 1024 ).single("image"), // Overrides with 5MB limit
    validateCreateEventType,
    validateRequest,
    createeventType
  );
  
router.put("/update/:id", verifyAccessToken ,uploadImageToS3("eventtype").single("image"), validateUserID, validateUpdateEventType, validateRequest, updateeventType);
router.put("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteeventType);
router.put("/active/:id", verifyAccessToken, validateUserID, validateRequest, activeEventtype)
export default router;
