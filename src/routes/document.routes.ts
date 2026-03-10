import { Router } from "express";
import { uploadStatements, getStatements, deleteStatement } from "../controllers/document.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import uploadToS3 from "../config/multer";

const router = Router();

// multer configured for the bank-statements folder, up to 4 files
const uploadMiddleware = uploadToS3("bank-statements").array("statements", 4);

// POST /document/upload-statements/:leadId  — public (no auth, sent via email link)
router.post("/upload-statements/:leadId", uploadMiddleware, uploadStatements);

// GET /document/statements/:leadId  — public (page needs to load existing statements)
router.get("/statements/:leadId", getStatements);

// DELETE /document/statements/:leadId/:documentId  — admin only
router.delete("/statements/:leadId/:documentId", verifyAccessToken, deleteStatement);

export default router;
