import { body } from "express-validator";

export const validateUserReferralCode = [

    body("referralCode")
        .notEmpty().withMessage("Referral Code cannot be empty.")
        .isAlphanumeric().withMessage("Referral Code must contain only letters and numbers.")
        .trim()
        .escape()

]

export const validateUpdateUserReferralCode = [

    body("referralCode")
        .optional()
        .trim()
        .escape()
        .custom((value) => {
            if (value !== "" && value !== undefined) {
                throw new Error('Referral code can not be changed');
            }
            return true;
        })

]


