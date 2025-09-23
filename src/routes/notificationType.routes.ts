// routes/notificationTypeRoutes.ts
import { Router } from 'express';
import {
    getNotificationTypes,
    getNotificationTypeById,
    createNotificationType,
    updateNotificationType,
    deleteNotificationType
} from '../controllers/notificationType.controller';
import { validateNotificationType } from '../middlewares/notificationType.validation';
import { validateUserID } from '../middlewares/user.validation';
import { validateRequest } from '../middlewares/otp.validation';
import { verifyAccessToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/all', verifyAccessToken, getNotificationTypes);
router.get('/', verifyAccessToken, getNotificationTypeById);
router.post('/create', verifyAccessToken, validateNotificationType, validateRequest, createNotificationType);
router.put('/update/:id', verifyAccessToken, validateUserID, validateNotificationType, validateRequest, updateNotificationType);
router.delete('/delete/:id', verifyAccessToken, validateUserID, validateRequest, deleteNotificationType);

export default router;