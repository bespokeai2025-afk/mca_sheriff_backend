import { body, param } from "express-validator";

export const validaterefrenceSlider = [
    body('name')
        .notEmpty().withMessage("Name is required.")
        .isString().withMessage("name must be string")
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("Name must only contain alphabets and spaces.")
        .trim()
        .escape(),

    body('description')
        .isString().withMessage('Description must be a string')
        .notEmpty().withMessage('Description is required')
        .trim().escape(),

    body('image')
        .optional()
        .isString().withMessage('Image must be a string')
        .trim().escape(),
]

export const validateUserID = [

    param("id")
        .notEmpty().withMessage("User ID cannot be empty.")
        .isUUID().withMessage("Invalid user ID")
        .trim()
        .escape()
]