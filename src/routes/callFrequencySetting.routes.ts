import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { CallFrequencySettingController } from "../controllers/callFrequencySetting.controller";

const router = express.Router();

// POST /call-frequency/frequency
router.post("/add-frequency", verifyAccessToken, CallFrequencySettingController.create);

router.post("/get-frequency", verifyAccessToken, CallFrequencySettingController.getAll);
router.post("/update-frequency", verifyAccessToken, CallFrequencySettingController.update);

export default router;
