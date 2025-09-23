import { body, param } from "express-validator";

export const validateUserSurveyAnswers = [
    body("user_id")
        .notEmpty().withMessage("User ID is required.")
        .isString().withMessage("User ID must be a string.")
        .isUUID().withMessage("Invalid User ID format."),

    body("responses")
        .isArray({ min: 1 }).withMessage("Responses must be a non-empty array."),

    body("responses.*.question_id")
        .notEmpty().withMessage("Question ID is required.")
        .isString().withMessage("Question ID must be a string.")
        .isUUID().withMessage("Invalid Question ID format."),

    body("responses.*.answer_id")
        .notEmpty().withMessage("Answer ID is required.")
        .isString().withMessage("Answer ID must be a string.")
        .isUUID().withMessage("Invalid Answer ID format."),
];

export const validateUserID = [
    param("id")
        .notEmpty().withMessage("User ID cannot be empty.")
        .isUUID().withMessage("Invalid User ID format.")
        .trim()
        .escape(),
];
