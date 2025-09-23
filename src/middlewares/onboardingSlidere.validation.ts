import { body, param } from "express-validator";

export const validateOnboarding = [
    body('title')
        .notEmpty().withMessage("Title is required.")
        .isString().withMessage("Title must be a string")
        .trim()
        .escape(),

    body('description')
        .notEmpty().withMessage("Description is required.")
        .isString().withMessage("Description must be a string")
        .trim()
        .escape(),

    // body('image')
    //     .notEmpty().withMessage("Image is required.")
    //     .trim()
    //     .escape(),


    body('priority')
        .isInt({ min: 0 }).withMessage("Priority must be a non-negative integer"),
];

export const validateOnboardingID = [
    param("id")
        .notEmpty().withMessage("ID cannot be empty.")
        .isUUID().withMessage("Invalid ID format")
        .trim()
        .escape(),
];
