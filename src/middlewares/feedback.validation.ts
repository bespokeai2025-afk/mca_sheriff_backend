import { body } from "express-validator";

export const validateFeedback = [
    body("feedback")
        .trim()
        .escape()
        .notEmpty().withMessage("Feedback is required")
        .isString().withMessage("Feedback must be a string"),

    body("rating")
        .isInt({ min: 1, max: 5 }).withMessage("Rating must be an integer between 1 and 5"),
];