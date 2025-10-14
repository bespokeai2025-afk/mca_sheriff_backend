import { Router } from "express";
import { addAreaCount, editAreaCount, getAllAreaCounts } from "../controllers/areaCount.controller";

const router = Router();

router.post("/add", addAreaCount);
router.post("/update", editAreaCount);
router.get("/fetch", getAllAreaCounts);

export default router;
