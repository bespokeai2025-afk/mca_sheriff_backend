import express from "express";
import { CenterStagedCallController } from "../controllers/centerStagedCall.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/call-filter", verifyAccessToken, CenterStagedCallController.callFilterCenterStage);

export default router;
