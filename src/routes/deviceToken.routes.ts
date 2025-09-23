import { Router } from 'express';
import {
    getDeviceTokens,
    getDeviceTokenById,
    createDeviceToken,
    updateDeviceToken,
    deleteDeviceToken,
    getDeviceTokenByUserId
} from '../controllers/deviceToken.controller';
import { validateDeviceToken, validateUpdateDeviceToken } from '../middlewares/deviceToken.validation';
import { verifyAccessToken } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/otp.validation';
import { validateUserID } from '../middlewares/user.validation';

const router = Router();

router.get('/all', verifyAccessToken, getDeviceTokens);
router.get('/', verifyAccessToken, getDeviceTokenById);
router.get('/user', verifyAccessToken, getDeviceTokenByUserId);
router.post('/create', verifyAccessToken, validateRequest, createDeviceToken);
router.put('/update/:id', verifyAccessToken, validateUserID, validateUpdateDeviceToken, validateRequest, updateDeviceToken);
router.delete('/delete/:id', verifyAccessToken, validateUserID, validateRequest, deleteDeviceToken);

export default router;