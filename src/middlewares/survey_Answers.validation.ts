

import { body, param } from "express-validator";

export const validateSurvey_answers = [
    body('answer_text')
        .notEmpty().withMessage("question_text is required.")
        .isString().withMessage("question_text must be string")
        .trim()
        .escape(),


    body("question_id")
        .notEmpty().withMessage("question_id type is required.")
        .isString().withMessage("question_id type ID must be a string.")
        .isLength({ min: 36, max: 36 }).withMessage("Invalid question_id ID format."),
    body("next_id")
        .optional()
        .isString().withMessage("question_id type ID must be a string.")
        .isLength({ min: 36, max: 36 }).withMessage("Invalid question_id ID format."),
]

export const validateUserID = [

    param("id")
        .notEmpty().withMessage("User ID cannot be empty.")
        .isUUID().withMessage("Invalid user ID")
        .trim()
        .escape()
]