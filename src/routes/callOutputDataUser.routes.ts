
import express from "express";
// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { createCallOutputData, deletefaq, getUsercallingData,getUserCallDataCount,getUsercallingHistory,getUsercallingDataLead} from "../controllers/callOutputData.controller";
import { validateCallOutputData, validateUserID } from "../middlewares/calloutputdata.validation";
// Create Express router
const router = express.Router();
router.get("/get-all-calldata", verifyAccessToken, getUsercallingData);
router.get("/get-call-count", verifyAccessToken, getUserCallDataCount );
router.post("/get-user-history", verifyAccessToken, getUsercallingHistory );
router.get("/get-userCall-lead",verifyAccessToken,getUsercallingDataLead);
// router.get("/get-userCall-status",verifyAccessToken,getCallDropdownList);
// router.get("/user-yet-tocall",verifyAccessToken,getUserYetToCall);
// router.post("/create", verifyAccessToken,  validateCallOutputData, validateRequest, createCallOutputData);
router.post("/create", createCallOutputData);
router.put("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deletefaq);


export default router;
