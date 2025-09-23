import { body, param } from "express-validator";



export const validatecrmdata = [
  

    body('mobile_number')
        .notEmpty().withMessage("Mobile number is required.")
        .isString().withMessage("Mobile number must be a string")
        .isLength({ min: 10, max: 15 }).withMessage("Mobile number must be between 10 to 15 characters")
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