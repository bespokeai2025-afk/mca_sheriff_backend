import express from "express";
import { validateRequest } from "../middlewares/otp.validation";
import { validateExcelFile } from "../middlewares/validateExcelFile";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import {getLeadFilters,getLeadFilterById,updateLeadFilterStatus, getDataFromDynamicsQuery } from "../controllers/leadFilterMaster.controller";


const router = express.Router();

router.get("/get-leadfiltermaster", verifyAccessToken, getLeadFilters);
router.get("/get-leadfiltermasterByID/:id", verifyAccessToken, getLeadFilterById);

router.get("/get-DataFromDynamicsQuery", getDataFromDynamicsQuery);

router.post("/update-lead-filter-status/:id", updateLeadFilterStatus);
export default router;
