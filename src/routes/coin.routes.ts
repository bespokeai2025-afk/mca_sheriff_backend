import { getallCoins } from '../controllers/coin.controller'
import express from 'express'
import { verifyAccessToken } from '../middlewares/auth.middleware'
import { validateUserID } from '../middlewares/user.validation'
import { validateRequest } from '../middlewares/otp.validation'

const router = express.Router()

router.get('/count', verifyAccessToken, getallCoins)

export default router