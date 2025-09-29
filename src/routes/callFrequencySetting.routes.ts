import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { CallFrequencySettingController } from "../controllers/callFrequencySetting.controller";

const router = express.Router();

// POST /call-frequency/frequency
router.post("/add-frequency", verifyAccessToken, CallFrequencySettingController.create);

// GET /call-frequency/
router.post("/get-frequency", verifyAccessToken, CallFrequencySettingController.getAll);

export default router;
