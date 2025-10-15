import express from "express";
import { getContacts } from "../controllers/contactfromdynamics.controller";

const router = express.Router();

// Fetch contacts from Dynamics 365 with pagination
router.get("/contacts", getContacts);


export default router;
