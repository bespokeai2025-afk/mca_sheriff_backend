/**
 * Routes for main category operations
 * Defines API endpoints for CRUD operations on main categories
 */

import express from "express";

// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

// Import controller methods
import {getonboardingSlidere ,deleteonboardingSlidere ,createonboardingSlidere,getonboardingSlidereById ,toggleOnboardingActiveController,updateonboardingSlidere, getAllSliderWithoutToken} from "../controllers/onboardingSlider.controller";

// Import validation middleware
import { validateOnboarding,validateOnboardingID } from "../middlewares/onboardingSlidere.validation";


// Import file upload configuration
import uploadImageToS3 from "../config/uploadiamges";

// Create Express router
const router = express.Router();


// Get all main categories
router.get("/all",getonboardingSlidere );

router.get("/getAll",getAllSliderWithoutToken);

// Get a specific main category by ID
router.get("/:id", verifyAccessToken, getonboardingSlidereById);


// Create a new main category
router.post("/create", verifyAccessToken,uploadImageToS3("onboarding").single("image"), validateOnboarding, validateRequest, createonboardingSlidere);


// Update an existing main category
router.put("/update/:id", verifyAccessToken,uploadImageToS3("onboarding").single("image"), validateOnboarding, validateOnboardingID, validateRequest, updateonboardingSlidere)


// Delete a main category
router.put("/delete/:id", verifyAccessToken, validateOnboardingID, validateRequest,deleteonboardingSlidere );

router.put("/active/:id", verifyAccessToken, validateOnboardingID, validateRequest,toggleOnboardingActiveController );

export default router;
