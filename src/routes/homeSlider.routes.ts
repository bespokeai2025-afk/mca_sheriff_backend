/**
 * Routes for main category operations
 * Defines API endpoints for CRUD operations on main categories
 */

import express from "express";

// Import middleware for validation and authentication
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

// Import controller methods
import {getHomeslidereById ,deleteHomeslidere ,createHomeslidere,getHomeslidere ,toggleHomeActiveController,updateHomeslidere} from "../controllers/homeSlider.controller";

// Import validation middleware
import { validateHomeSlider,validateHomeSliderID } from "../middlewares/homeSlidere.validation";


// Import file upload configuration
import uploadImageToS3 from "../config/uploadiamges";

// Create Express router
const router = express.Router();


// Get all main categories
router.get("/all",verifyAccessToken,getHomeslidere ); 


// Get a specific main category by ID
router.get("/:id", verifyAccessToken, getHomeslidereById);


// Create a new main category
router.post("/create", verifyAccessToken,uploadImageToS3("Home").single("image"), validateHomeSlider, validateRequest, createHomeslidere);


// Update an existing main category
router.put("/update/:id", verifyAccessToken,uploadImageToS3("Home").single("image"), validateHomeSlider, validateHomeSliderID, validateRequest, updateHomeslidere)


// Delete a main category
router.put("/delete/:id", verifyAccessToken, validateHomeSliderID, validateRequest,deleteHomeslidere );

router.put("/active/:id", verifyAccessToken, validateHomeSliderID, validateRequest,toggleHomeActiveController );

export default router;
