import { Router } from "express";
import { LeadFilterStatusController } from "../controllers/leadFilterStatus.controller";

const router = Router();

router.get("/get-status-fromMicrosoftDynamic", LeadFilterStatusController.syncFromDynamics);

router.get("/get-statusCode", LeadFilterStatusController.getStored);

export default router;
