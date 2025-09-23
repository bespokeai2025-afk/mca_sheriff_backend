// routes/notificationRoutes.ts
import { Router } from 'express';
import {
    getNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
    getNotificationByUserId,
    getNotificationByEventId,
    getNotificationByTypeId,
    getNotificationByUserIdEventId,
    getNotificationByUserIdEventIdTypeId
} from '../controllers/notification.controller';
import { validateNotification, validateUpdateNotification } from '../middlewares/notification.middleware';
import { verifyAccessToken } from '../middlewares/auth.middleware';
import { validateUserID } from '../middlewares/user.validation';
import { validateRequest } from '../middlewares/otp.validation';

const router = Router();

router.get('/all', verifyAccessToken, getNotifications);
router.get('/', verifyAccessToken, getNotificationById);
router.get('/user', verifyAccessToken, getNotificationByUserId);
router.get('/event', verifyAccessToken, getNotificationByEventId);
router.get('/type', verifyAccessToken, getNotificationByTypeId);
router.get('/user-event', verifyAccessToken, getNotificationByUserIdEventId);
router.get('/user-event-type', verifyAccessToken, getNotificationByUserIdEventIdTypeId);

router.post('/create', verifyAccessToken, validateNotification, validateRequest, createNotification);
router.put('/update/:id', verifyAccessToken, validateUserID, validateUpdateNotification, validateRequest, updateNotification);
router.delete('/delete/:id', verifyAccessToken, validateUserID, validateRequest, deleteNotification);

export default router;