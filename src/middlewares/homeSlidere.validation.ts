import { body, param } from "express-validator";

export const validateHomeSlider = [
    body('title')
        .notEmpty().withMessage("Title is required.")
        .isString().withMessage("Title must be a string")
        .trim()
        .escape(),

    body('description')
        .optional()
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

export const validateHomeSliderID = [
    param("id")
        .notEmpty().withMessage("ID cannot be empty.")
        .isUUID().withMessage("Invalid ID format")
        .trim()
        .escape(),
];
