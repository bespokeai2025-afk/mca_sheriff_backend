import { body, param } from "express-validator";



export const validateusercallingdata = [
    body('vendor_id')
        .notEmpty().withMessage("Vendor ID is required.")
        .isString().withMessage("Vendor ID must be a string")
        .trim()
        .escape(),

    body('mobile_number')
        .notEmpty().withMessage("Mobile number is required.")
        .isString().withMessage("Mobile number must be a string")
        .isLength({ min: 10, max: 15 }).withMessage("Mobile number must be between 10 to 15 characters")
        .trim()
        .escape(),

    body('sentiment_analysis')
        .notEmpty().withMessage("Sentiment analysis is required.")
        .isString().withMessage("Sentiment analysis must be a string")
        .trim()
        .escape(),

    body('end_reason')
        .notEmpty().withMessage("End reason is required.")
        .isString().withMessage("End reason must be a string")
        .trim()
        .escape(),

    body('time')
        .notEmpty().withMessage("Time is required.")
        .isString().withMessage("Time must be a string")
        .trim()
        .escape(),

    body('status')
        .notEmpty().withMessage("Status is required.")
        .isString().withMessage("Status must be a string")
        .trim()
        .escape(),
];

export const validateUserID = [

    param("id")
        .notEmpty().withMessage("User ID cannot be empty.")
        .isUUID().withMessage("Invalid user ID")
        .trim()
        .escape()
]