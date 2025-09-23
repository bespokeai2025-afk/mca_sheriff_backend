import { body } from "express-validator";

export const validateAnswer = [
    body("user_id")
        .notEmpty().withMessage("User ID is required"),

    body("main_category_id")
        .notEmpty().withMessage("Main Category ID is required"),

    body("skill_ids")
        .isArray({ min: 1 }).withMessage("At least one skill ID is required")
];
