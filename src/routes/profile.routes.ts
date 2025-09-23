import express from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { getProfile } from "../controllers/profile.controller";

const router = express.Router();

router.get("/", verifyAccessToken, getProfile);


export default router;
