import express from "express";
import {
    validateAppConfig,
    validateAppConfigID
} from "../middlewares/appConfig.validation";

import {
    createAppVersionConfig,
    getAllAppVersionConfigs,
    getAppVersionConfigByAppVersion,
    updateAppVersionConfig,
    toggleAppConfigStatus,
    softDeleteAppVersionConfig,systemundermaintanace
} from "../controllers/appVersionConfig.controller";

import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = express.Router();

// Create new App Version Config
router.post("/create", verifyAccessToken, validateAppConfig, createAppVersionConfig);

router.post("/systemundermaintanace", verifyAccessToken, systemundermaintanace);
// Get all App Version Configs
router.get("/all", verifyAccessToken, getAllAppVersionConfigs);

// Get App Version Config by ID
router.get("/get_by_version/:app_version", verifyAccessToken, getAppVersionConfigByAppVersion);

// Update App Version Config by ID
router.put("/update/:id", verifyAccessToken, validateAppConfigID, validateAppConfig, updateAppVersionConfig);

// Soft Delete App Version Config by ID (set isDeleted = true)
router.put("/delete/:id", verifyAccessToken, validateAppConfigID, softDeleteAppVersionConfig);

// Toggle isActive Status by ID
router.put("/active/:id", verifyAccessToken, validateAppConfigID, toggleAppConfigStatus);

// Hard Delete App Version Config by ID

export default router;
