import { body, param } from "express-validator";

export const validatesurvey = [
    body('question_text')
        .notEmpty().withMessage("question_text is required.")
        .isString().withMessage("question_text must be string")
        .trim()
        .escape(),

    body('category')
   
    .isArray().withMessage("Must be an array of strings.")
    .custom((value) => {
        if (!value.every((item: any) => typeof item === "string")) {
            throw new Error("Each item in whatlearn must be a string.");
        }
        return true; // Required for valid values
    }),

]

export const validateUserID = [

    param("id")
        .notEmpty().withMessage("User ID cannot be empty.")
        .isUUID().withMessage("Invalid user ID")
        .trim()
        .escape()
]