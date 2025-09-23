import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/otp.validation";
import { validateUserID } from "../middlewares/user.validation";
import { validateDeleteRequest, validateDeleteStatusUpdate } from "../middlewares/deleteAccount.validation";
import {
    createDeleteRequest,
    getAllDeleteRequests,
    // getDeleteRequestById,
    updateDeleteRequestStatus 
} from "../controllers/deleteAccountRequest.controller";

const router = express.Router();

// Get all delete account requests (Admin only)
router.get("/all", verifyAccessToken, getAllDeleteRequests);

// Get a specific delete account request by ID
// router.get("/:id", verifyAccessToken, validateUserID, validateRequest, getDeleteRequestById);

// User submits a delete account request
router.post("/create", verifyAccessToken,  createDeleteRequest);

// Admin updates the delete request status (COMPLETED or REJECTED)
router.put("/update/:id", verifyAccessToken, validateDeleteStatusUpdate, validateRequest, updateDeleteRequestStatus);

export default router;
