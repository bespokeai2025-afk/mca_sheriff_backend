// middleware/notificationTypeValidation.ts
import { isEmpty } from 'class-validator';
import { body, param, validationResult } from 'express-validator';

export const validateNotificationType = [
    body('type')
        .notEmpty().withMessage('type cannot be empty')
        .isIn(['InApp', 'Push', 'both']).withMessage('Type must be either "InApp","Push" or "both"'),
];
