import { body, param } from "express-validator";

// Validation for POST (Creating an event) - Both fields required
export const validateCreateEventType = [
    body('name')
        .notEmpty().withMessage("Name is required.")
        .isString()
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("Name must only contain alphabets and spaces.")
        .trim()
        .escape(),

    body('description')
        .notEmpty().withMessage("Description is required.")
        .isString().withMessage('Description must be a string')
        .trim()
        .escape(),
    body('sequenceNo')
        .notEmpty().withMessage("sequenceNo cannot be empty."),
    body('image')
        .optional()
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error("Image is required.");
            }
            if (req.file.size > 500 * 1024) {
                throw new Error("Image size must be less than 500KB.");
            }
            return true;
        }),

];

// Validation for PUT (Updating an event) - Optional but cannot be empty


export const validateUpdateEventType = [

    body("name")
        .optional({ nullable: true }) // Allows the field to be missing
        .custom((value) => {
            if (value !== undefined && value.trim() === "") {
                throw new Error("Description cannot be empty if provided.");
            }
            return true;
        })
        .isString().withMessage("Description must be a string.")
        .trim()
        .escape(),
    body("description")
        .optional({ nullable: true }) // Allows the field to be missing
        .custom((value) => {
            if (value !== undefined && value.trim() === "") {
                throw new Error("Description cannot be empty if provided.");
            }
            return true;
        })
        .isString().withMessage("Description must be a string.")
        .trim()
        .escape(),
    body('image')
        .optional()
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error("Image is required.");
            }
            if (req.file.size > 500 * 1024) {
                throw new Error("Image size must be less than 500KB.");
            }
            return true;
        }),
];


// Validation for User ID
export const validateUserID = [
    param("id")
        .notEmpty().withMessage("User ID cannot be empty.")
        .isUUID().withMessage("Invalid user ID"),
];
