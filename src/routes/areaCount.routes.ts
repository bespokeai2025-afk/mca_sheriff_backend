import { Router } from "express";
import { addAreaCount, editAreaCount, getAllAreaCounts } from "../controllers/areaCount.controller";

const router = Router();

router.post("/add", addAreaCount);
router.put("/update/:id", editAreaCount);
router.get("/fetch", getAllAreaCounts);

export default router;
