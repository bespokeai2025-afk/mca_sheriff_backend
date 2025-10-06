import express from "express";
import { validateRequest } from "../middlewares/otp.validation";
import { validateExcelFile } from "../middlewares/validateExcelFile";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import {getLeadFilters } from "../controllers/leadFilterMaster.controller";


const router = express.Router();

router.get("/get-leadfiltermaster", verifyAccessToken, getLeadFilters);


export default router;
