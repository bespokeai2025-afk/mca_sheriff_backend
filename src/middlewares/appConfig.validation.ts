import { body, param } from "express-validator";

// Validation for Creating or Updating App Version Configuration
export const validateAppConfig = [
    body('app_version')
    .notEmpty().withMessage("App version is required.")
    .isInt({ min: 1 }).withMessage("App version must be a positive integer.")
    .toInt(),  // Converts valid numeric strings (e.g., "10") to integers automatically



    body('force_update')
        .notEmpty().withMessage("Force update flag is required.")
        .isBoolean().withMessage("Force update must be a boolean value."),

    body('force_update_message')
        .optional()
        .isString().withMessage("Force update message must be a string.")
        .trim()
        .escape(),

    body('privacy_policy_updated')
        .notEmpty().withMessage("Privacy policy updated flag is required.")
        .isBoolean().withMessage("Privacy policy updated must be a boolean value."),

    body('force_logout')
        .notEmpty().withMessage("Force logout flag is required.")
        .isBoolean().withMessage("Force logout must be a boolean value."),
];

// Validation for App Config ID (if required for fetching or updating by ID)
export const validateAppConfigID = [
    param("id")
        .notEmpty().withMessage("Configuration ID cannot be empty.")
        .isUUID().withMessage("Invalid configuration ID format."),
];
