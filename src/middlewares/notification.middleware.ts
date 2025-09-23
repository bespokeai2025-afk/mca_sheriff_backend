// middleware/notificationValidation.ts
import { body, param, validationResult } from 'express-validator';

export const validateNotification = [
    body('message')
        .notEmpty().withMessage('Message cannot be empty')
        .isString().withMessage('Message must be a string'),
    body('type')
        .notEmpty().withMessage('Type ID cannot be empty')
        .isUUID().withMessage('Type ID must be an integer'),
    body('user')
        .notEmpty().withMessage('user ID cannot be empty')
        .isUUID().withMessage('User  ID must be an integer'),
    body('event')
        .notEmpty().withMessage('event ID cannot be empty')
        .isUUID().withMessage('Event ID must be an integer'),
    body('expires_at')
        .notEmpty().withMessage('expiry date cannot be empty')
        .isISO8601().withMessage('Expires at must be a valid date'),
    body('is_global')
        .optional()
        .isBoolean().withMessage('Is global must be a boolean')
];

export const validateUpdateNotification = [
    body('message')
        .optional()
        .isString().withMessage('Message must be a string'),
    body('type')
        .optional()
        .isUUID().withMessage('Type ID must be an integer'),
    body('user')
        .optional()
        .isUUID().withMessage('User  ID must be an integer'),
    body('event')
        .optional()
        .isUUID().withMessage('Event ID must be an integer'),
    body('expires_at')
        .optional()
        .isISO8601().withMessage('Expires at must be a valid date'),
    body('is_global')
        .optional()
        .isBoolean().withMessage('Is global must be a boolean')
];

