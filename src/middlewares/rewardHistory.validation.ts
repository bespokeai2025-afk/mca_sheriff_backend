import { body } from "express-validator";

export const validateRewardHistory = [
    body("user_id")
        .notEmpty().withMessage("User  ID is required")
        .isString().withMessage("User  ID must be a string"),

    body("transaction_type")
        .notEmpty().withMessage("Transaction type is required")
        .isIn(['Earned', 'Deducted']).withMessage("Transaction type must be either 'Earned' or 'Deducted'"),

    body("amount")
        .notEmpty().withMessage("Amount is required")
        .isInt({ gt: 0 }).withMessage("Amount must be a positive integer"),

    body("description")
        .notEmpty().withMessage("Description is required")
        .isString().withMessage("Description must be a string"),

    body("reward_type")
        .optional()
        .notEmpty().withMessage("reward type is required")
        .isString().withMessage("reward type must be a string")
        .isIn(['referral', 'event']).withMessage("reward type must be either 'referral' or 'event'"),
];

export const validateUpdateRewardHistory = [
    body("user_id")
        .optional()
        .notEmpty().withMessage("User  ID is required")
        .isString().withMessage("User  ID must be a string"),

    body("transaction_type")
        .optional()
        .notEmpty().withMessage("Transaction type is required")
        .isIn(['Earned', 'Deducted']).withMessage("Transaction type must be either 'Earned' or 'Deducted'"),

    body("amount")
        .optional()
        .notEmpty().withMessage("Amount is required")
        .isInt({ gt: 0 }).withMessage("Amount must be a positive integer"),

    body("description")
        .optional()
        .notEmpty().withMessage("Description is required")
        .isString().withMessage("Description must be a string"),

    body("reward_type")
        .optional()
        .notEmpty().withMessage("reward type is required")
        .isString().withMessage("reward type must be a string")
        .isIn(['referral', 'event']).withMessage("reward type must be either 'referral' or 'event'"),
];