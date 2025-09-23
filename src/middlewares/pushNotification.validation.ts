import { body } from 'express-validator';

export const validatePushNotification = [
    body('title')
        .notEmpty().withMessage('Title cannot be empty')
        .isString().withMessage('Title must be a string'),

    body('message')
        .notEmpty().withMessage('Message cannot be empty')
        .isString().withMessage('Message must be a string'),

    body('payload')
        .optional()
        .isObject().withMessage('Payload must be a valid JSON object'),

    body('topic')
        .optional()
        .isString().withMessage('Topic must be a string'),

    body('tokens')
        .optional()
        .isArray().withMessage('Tokens must be an array of strings'),

    body('tokens.*')
        .optional()
        .isString().withMessage('Each token must be a string'),

    body('scheduledTime')
        .notEmpty().withMessage('scheduledTime cannot be empty')
        .isISO8601().withMessage('Scheduled time must be a valid date')
];

export const validateUpdatePushNotification = [
    body('title')
        .optional()
        .isString().withMessage('Title must be a string'),

    body('message')
        .optional()
        .isString().withMessage('Message must be a string'),

    body('payload')
        .optional()
        .isObject().withMessage('Payload must be a valid JSON object'),

    body('topic')
        .optional()
        .isString().withMessage('Topic must be a string'),

    body('tokens')
        .optional()
        .isArray().withMessage('Tokens must be an array of strings'),

    body('tokens.*')
        .optional()
        .isString().withMessage('Each token must be a string'),

    body('scheduledTime')
        .optional()
        .isISO8601().withMessage('Scheduled time must be a valid date')
];