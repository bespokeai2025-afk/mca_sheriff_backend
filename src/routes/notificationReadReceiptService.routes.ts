import { Router } from 'express';
// import { getNotificationReadReceipts, getNotificationReadReceiptById, createNotificationReadReceipt, updateNotificationReadReceipt, deleteNotificationReadReceipt } from '../controllers/notificationReadReceipt.controller';
import { validateNotificationReadReceipt, validateUpdateNotificationReadReceipt } from '../middlewares/notificationReadReceiptService.validation';
import { verifyAccessToken } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/otp.validation';
import { validateUserID } from '../middlewares/user.validation';
import { createNotificationReadReceipt, deleteNotificationReadReceipt, getNotificationReadReceiptById, getNotificationReadReceipts, updateNotificationReadReceipt } from '../controllers/notificationReadReceipt.controller';

const router = Router();

router.get('/all', verifyAccessToken, getNotificationReadReceipts);
router.get('/', verifyAccessToken, getNotificationReadReceiptById);
router.post('/create', verifyAccessToken, validateNotificationReadReceipt, validateRequest, createNotificationReadReceipt);
router.put('/update/:id', verifyAccessToken, validateUserID, validateUpdateNotificationReadReceipt, validateRequest, updateNotificationReadReceipt);
router.delete('/delete/:id', verifyAccessToken, validateUserID, validateRequest, deleteNotificationReadReceipt);

export default router;