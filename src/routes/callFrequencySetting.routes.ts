import express, { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { CallFrequencySettingController } from "../controllers/callFrequencySetting.controller";
import { validateCron } from "../middlewares/cronValidation";
import { validationResult } from "express-validator";

const router = express.Router();

// Middleware to check validation results
const checkValidation = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      result: false,
      statuscode: 400,
      message: "Validation failed",
      data: errors.array(),
    });
    return; // ensure void return
  }
  next();
};

// Create new call frequency setting
router.post(
  "/add-frequency",
  verifyAccessToken,
  validateCron,
  checkValidation,
  CallFrequencySettingController.create
);

// Get all frequency settings
router.post(
  "/get-frequency",
  verifyAccessToken,
  CallFrequencySettingController.getAll
);

// Update existing call frequency setting
router.post(
  "/update-frequency",
  verifyAccessToken,
  validateCron,
  checkValidation,
  CallFrequencySettingController.update
);

export default router;
