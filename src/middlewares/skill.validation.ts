import { body } from "express-validator";

export const validateSkill = [
  body("name")
    .trim()
    .escape()
    .notEmpty().withMessage("Skill name is required")
    .isString().withMessage("Skill name must be a string")
    .isLength({ max: 255 }).withMessage("Skill name must not exceed 255 characters"),

  body("description")
    .optional()
    .trim()
    .escape()
    .isString().withMessage("Description must be a string"),

];


export const validateUpdateSkill = [
  body("name")
    .trim()
    .escape()
    .optional()
    .notEmpty().withMessage("Skill name is required")
    .isString().withMessage("Skill name must be a string")
    .isLength({ max: 255 }).withMessage("Skill name must not exceed 255 characters"),

  body("description")
    .optional()
    .trim()
    .escape()
    .isString().withMessage("Description must be a string"),

];
