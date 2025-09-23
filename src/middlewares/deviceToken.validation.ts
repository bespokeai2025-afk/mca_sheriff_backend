import { body, validationResult } from 'express-validator';

export const validateDeviceToken = [
    body('token')
        .notEmpty().withMessage('Token cannot be empty'),
];

export const validateUpdateDeviceToken = [
    body('token')
        .optional()
        .notEmpty().withMessage('Token cannot be empty'),
];  