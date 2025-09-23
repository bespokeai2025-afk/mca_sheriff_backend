import express from "express";
import { deleteUser, getUser, getUserById, getUserConfig, logoutUser, updateUser } from "../controllers/user.controller";
import { validateRequest } from "../middlewares/otp.validation";
import { validateUser, validateUserID } from "../middlewares/user.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/all", verifyAccessToken, getUser);
router.get("/", verifyAccessToken, getUserById);
router.get("/config", verifyAccessToken, getUserConfig);
router.put("/update/:id", verifyAccessToken, validateUserID, validateUser, validateRequest, updateUser);
router.delete("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteUser);

router.post('/logout/:id', verifyAccessToken, validateUserID, validateRequest, logoutUser)

export default router;
