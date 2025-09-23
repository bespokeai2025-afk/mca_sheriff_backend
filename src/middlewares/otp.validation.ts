import { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
import { validationResult } from "express-validator";


export const validateOtpRequest = [
    body("mobile")
        .notEmpty()
        .withMessage("Mobile number is required")
        .matches(/^[6-9]\d{9}$/)
        .withMessage("Mobile number must be 10 digits and start with 6-9")
        .trim()
        .escape()
];

export const validateOTP = [
    body("mobile")
        .notEmpty()
        .withMessage("Mobile number is required")
        .isString()
        .matches(/^[6-9]\d{9}$/).withMessage("Invalid mobile number format")
        .trim().escape(),

    body("otp")
        .notEmpty()
        .withMessage("Mobile number is required")
        .isNumeric()
        .isLength({ min: 4, max: 4 }).withMessage("OTP must be 4 digits")
        .trim()
        .escape(),
];

export const validateRequest = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ result: false, message: errors.array()[0].msg, error: errors });
        return;
    }
    next();
};