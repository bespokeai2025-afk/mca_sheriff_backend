import { body, param } from "express-validator";

// Validation for creating a delete account request
export const validateDeleteRequest = [
    body("reason")
        .isString()
        .withMessage("Reason must be a string")
        .isLength({ min: 10, max: 500 })
        .withMessage("Reason must be between 10 and 500 characters"),
];

// Validation for updating the delete account request status (Admin action)
export const validateDeleteStatusUpdate = [
    param("id")
        .isUUID()
        .withMessage("Invalid request ID format"),
    body("status")
        .isIn(["COMPLETED", "REJECTED"])
        .withMessage("Status must be either 'COMPLETED' or 'REJECTED'"),
];
