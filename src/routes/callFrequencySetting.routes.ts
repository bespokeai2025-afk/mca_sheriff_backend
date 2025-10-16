import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { CallFrequencySettingController } from "../controllers/callFrequencySetting.controller";
import { validateCron } from "../middlewares/cronValidation";
import { validationResult } from "express-validator";

const router = express.Router();

// Middleware to check validation results
const checkValidation = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ result: false, statuscode: 400, message: "Validation failed", data: errors.array() });
  next();
};

router.post("/add-frequency", verifyAccessToken, validateCron, checkValidation, CallFrequencySettingController.create);
router.post("/get-frequency", verifyAccessToken, CallFrequencySettingController.getAll);
router.post("/update-frequency", verifyAccessToken, validateCron, checkValidation, CallFrequencySettingController.update);

export default router;
