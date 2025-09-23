import { body } from 'express-validator';

export const validateNotificationReadReceipt = [
    body('user')
        .notEmpty().withMessage('User  ID cannot be empty')
        .isString().withMessage('User  ID must be an integer'),
    body('notification')
        .notEmpty().withMessage('Notification ID cannot be empty')
        .isString().withMessage('Notification ID must be an integer'),

];
export const validateUpdateNotificationReadReceipt = [
    body('user')
        .optional().isString().withMessage('User  ID must be an integer'),
    body('notification')
        .optional().isString().withMessage('Notification ID must be an integer'),

];