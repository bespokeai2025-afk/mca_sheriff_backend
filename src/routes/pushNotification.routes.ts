import { Router } from 'express';
import { getPushNotifications, getPushNotificationById, createPushNotification, updatePushNotification, deletePushNotification, createTopicPushNotification, createBatchPushNotification } from '../controllers/pushNotification.controller';
import { validatePushNotification, validateUpdatePushNotification } from '../middlewares/pushNotification.validation';
import { verifyAccessToken } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/otp.validation';
import { validateUserID } from '../middlewares/user.validation';

const router = Router();

router.get('/all', verifyAccessToken, getPushNotifications);
router.get('/', verifyAccessToken, getPushNotificationById);
router.post('/create', verifyAccessToken, validatePushNotification, validateRequest, createPushNotification);
router.put('/update/:id', verifyAccessToken, validateUserID, validateUpdatePushNotification, validateRequest, updatePushNotification);
router.delete('/delete/:id', verifyAccessToken, validateUserID, validateRequest, deletePushNotification);


router.post("/topic", verifyAccessToken, validatePushNotification, validateRequest, createTopicPushNotification);

// Route for sending batch push notifications
router.post("/batch", verifyAccessToken, validatePushNotification, validateRequest, createBatchPushNotification);

export default router;