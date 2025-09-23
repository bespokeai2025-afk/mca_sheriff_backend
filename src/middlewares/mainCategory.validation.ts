import { body, param } from "express-validator";

export const validateMainCategory = [
    body('name')
        .notEmpty().withMessage("Name is required.")
        .isString().withMessage("name must be string")
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("Name must only contain alphabets and spaces.")
        .trim()
        .escape(),

    body('description')
        .isString().withMessage('Description must be a string')
        .notEmpty().withMessage('Description is required')
        .trim().escape(),

    body('image')
        .optional()
        .isString().withMessage('Image must be a string')
        .trim().escape(),


    body('priority')
        .isInt({ min: 0 }).withMessage('Priority must be an integer'),

    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array of strings')
        .custom(tags => Array.isArray(tags) && tags.every(tag => typeof tag === 'string'))
        .withMessage('Each tag must be a string'),

    body('tags.*') // Apply trim & escape to each tag inside the array
        .optional()
        .trim().escape(),

    body('additional_info')
        .optional()
        .isObject().withMessage('Additional info must be a valid JSON object'),


]

export const validateUserID = [

    param("id")
        .notEmpty().withMessage("User ID cannot be empty.")
        .isUUID().withMessage("Invalid user ID")
        .trim()
        .escape()
]


export const validateUpdateMainCategory = [
    body('name')
        .notEmpty().withMessage("Name is required.")
        .isString().withMessage("name must be string")
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("Name must only contain alphabets and spaces.")
        .trim()
        .optional()
        .escape(),

    body('description')
        .isString().withMessage('Description must be a string')
        .notEmpty().withMessage('Description is required')
        .optional()
        .trim().escape(),

    body('image')
        .optional()
        .isString().withMessage('Image must be a string')
        .trim().escape(),


    body('priority')
        .optional()
        .isInt({ min: 0 }).withMessage('Priority must be an integer'),

    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array of strings')
        .custom(tags => Array.isArray(tags) && tags.every(tag => typeof tag === 'string'))
        .withMessage('Each tag must be a string'),

    body('tags.*') // Apply trim & escape to each tag inside the array
        .optional()
        .trim().escape(),

    body('additional_info')
        .optional()
        .isObject().withMessage('Additional info must be a valid JSON object'),


]