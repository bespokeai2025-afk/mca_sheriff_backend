import { body } from "express-validator";

export const validateMarkAttendance = [
    body("event_id")
        .notEmpty().withMessage("Event ID is required")
        .isUUID().withMessage("Invalid Event ID format"),

    body("user_id")
        .notEmpty().withMessage("User ID is required")
        .isUUID().withMessage("Invalid User ID format"),

    body("marked_by")
        .notEmpty().withMessage("Marked by (user ID) is required")
        .isUUID().withMessage("Invalid Marked by User ID format"),

    // body("reward_coins")
    //     .notEmpty().withMessage("Reward coins are required")
    //     .isInt({ min: 0 }).withMessage("Reward coins must be a non-negative integer")
];
export const validateMarkAttendanceAll = [
    body("event_id")
        .notEmpty().withMessage("Event ID is required")
        .isUUID().withMessage("Invalid Event ID format"),

    body("users")
        .isArray().withMessage("Array of users is required")
        .notEmpty().withMessage("User ID is required"),

    body("marked_by")
        .notEmpty().withMessage("Marked by (user ID) is required")
        .isUUID().withMessage("Invalid Marked by User ID format"),

    // body("reward_coins")
    //     .notEmpty().withMessage("Reward coins are required")
    //     .isInt({ min: 0 }).withMessage("Reward coins must be a non-negative integer")
];

export const validateUpdateAttendance = [
    body("reward_coins")
        .optional()
        .isInt({ min: 0 }).withMessage("Reward coins must be a non-negative integer"),

    body("revoked")
        .optional()
        .isBoolean().withMessage("Revoked must be a boolean value"),

    body("revoked_by")
        .optional()
        .isUUID().withMessage("Invalid Revoked by User ID format")
];


