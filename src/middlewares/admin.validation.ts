import { body, param } from "express-validator";

export const validateAdmin = [
    body("mobile")
        .optional()
        .isString()
        .matches(/^[6-9]\d{9}$/)
        .withMessage("Mobile number must be 10 digits and start with 6-9.")
        .trim()
        .escape(),

    body("name")
        .optional()
        .isString()
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("Name must only contain alphabets and spaces.")
        .trim()
        .escape(),

    body("email")
        .optional()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .trim()
        .escape(),


]

export const validateUserID = [

    param("id")
        .notEmpty().withMessage("User ID cannot be empty.")
        .isUUID().withMessage("Invalid user ID")
        .trim()
        .escape()
]