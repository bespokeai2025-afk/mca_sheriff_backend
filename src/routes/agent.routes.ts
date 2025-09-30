import express from "express";
import { AgentController } from "../controllers/agent.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/get",  AgentController.getAgent);
router.post("/update", verifyAccessToken, AgentController.saveSelectedAgents);

router.get("/get-list", verifyAccessToken, AgentController.getAgentsActive);
// router.get("/update-active", verifyAccessToken, AgentController.getAgentsWithStatus);
export default router;
