import { body } from "express-validator";

export const validateReward = [
    body("name").trim().notEmpty().withMessage("Reward name is required").isString().escape(),
    body("coins").isInt().withMessage("Coins must be an integer").escape(),
    body("expiry").isISO8601().withMessage("Invalid date format").escape(),
    body("total_redeem_count").isInt().withMessage("Total redeem count must be an integer").escape()
];
export const validateUpdateReward = [
    body("name").optional().trim().notEmpty().withMessage("Reward name is required").isString().escape(),
    body("coins").optional().isInt().withMessage("Coins must be an integer").escape(),
    body("expiry").optional().isISO8601().withMessage("Invalid date format").escape(),
    body("total_redeem_count").optional().isInt().withMessage("Total redeem count must be an integer").escape()
];