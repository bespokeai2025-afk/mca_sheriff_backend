import { body, param } from "express-validator";

export const validatefaq = [
    body('name')
        .notEmpty().withMessage("Name is required.")
        .isString().withMessage("name must be string")
        .withMessage("Please add valid text")
        .trim()
        .escape(),

    body('description')
        .isString().withMessage('Description must be a string')
        .notEmpty().withMessage('Description is required')
        .trim().escape(),
]

export const validateUserID = [

    param("id")
        .notEmpty().withMessage("User ID cannot be empty.")
        .isUUID().withMessage("Invalid user ID")
        .trim()
        .escape()
]