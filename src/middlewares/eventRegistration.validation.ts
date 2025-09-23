import { body } from "express-validator";

// Validation for Creating Event Registration
export const validateCreateEventRegistration = [
    body("eventId")
        .notEmpty().withMessage("Event ID is required")
        .isUUID().withMessage("Invalid event ID format"),

    body("userId")
        .notEmpty().withMessage("User ID is required")
        .isUUID().withMessage("Invalid user ID format"),

    body("status")
        .optional()
        .isIn(["Registered", "Cancelled"]).withMessage("Invalid status value"),
];

// Validation for Updating Event Registration
export const validateUpdateEventRegistration = [
    body("status")
        .optional()
        .isIn(["Registered", "Cancelled"]).withMessage("Invalid status value"),

    body("cancelled_by")
        .optional()
        .isUUID().withMessage("Invalid cancelled_by ID format"),

    body("cancellation_reason")
        .optional()
        .isString().withMessage("Cancellation reason must be a string")
        .isLength({ max: 500 }).withMessage("Cancellation reason must not exceed 500 characters"),
];
