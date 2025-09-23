import { CreateReferralCode, deleteReferralCode, getReferralCodeByCode, getReferralCodeById, getReferralCodeByUserId, getReferralCodes, updateReferralCode } from '../controllers/userReferralCode.controller';
import { Router } from 'express';
import { validateRequest } from '../middlewares/otp.validation';
import { validateUpdateUserReferralCode } from '../middlewares/userReferralCode.validation';
import { verifyAccessToken } from '../middlewares/auth.middleware';
import { validateUserID } from '../middlewares/user.validation';

const router = Router()


router.get("/all", verifyAccessToken, getReferralCodes);


router.get("/", verifyAccessToken, getReferralCodeById);

router.get("/user", verifyAccessToken, getReferralCodeByUserId);
router.get("/code", verifyAccessToken, getReferralCodeByCode);

router.post('/create/:id', verifyAccessToken, validateUserID, validateRequest, CreateReferralCode)

router.put("/update/:id", verifyAccessToken, validateUserID, validateUpdateUserReferralCode, validateRequest, updateReferralCode);

router.delete("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteReferralCode);

export default router;