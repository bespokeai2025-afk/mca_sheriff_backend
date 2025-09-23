import { body } from "express-validator";

export const validateProfile = [
    body("mobile")
        .notEmpty()
        .withMessage("Mobile Number cannot be empty.")
        .isString()
        .matches(/^[6-9]\d{9}$/)
        .withMessage("Mobile number must be 10 digits and start with 6-9.")
        .trim()
        .escape(),

    body("name")
        .notEmpty()
        .withMessage("Name cannot be empty.")
        .isString()
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("Name must only contain alphabets and spaces.")
        .trim()
        .escape(),

    body("referralCode")
        .optional()
        .isString()
        .trim()
        .escape()

]