import { Request, Response } from "express";
import { DocumentService } from "../services/document.service";
import { errorWithoutData } from "../config/ApiResponse";

const documentService = new DocumentService();

// POST /document/upload-statements/:leadId
// Accepts up to 4 files under field name "statements"
// Body: month_0, month_1, month_2, month_3 — labels for each file
export const uploadStatements = async (req: Request, res: Response): Promise<any> => {
  try {
    const { leadId } = req.params;

    if (!leadId) {
      return res.status(400).json(errorWithoutData("leadId is required"));
    }

    const files = req.files as Express.MulterS3.File[];
    if (!files || files.length === 0) {
      return res.status(400).json(errorWithoutData("No files uploaded"));
    }

    // Collect month labels from body (month_0 … month_3) or months[] array
    const months: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const label =
        (req.body as any)[`month_${i}`] ||
        ((req.body as any).months || [])[i] ||
        `Statement ${i + 1}`;
      months.push(label);
    }

    const response = await documentService.uploadStatements(leadId, files, months);
    return res.status(response.result ? 200 : 400).json(response);
  } catch (error: any) {
    console.error("Error in uploadStatements:", error.message);
    return res.status(500).json(errorWithoutData("Internal server error"));
  }
};

// GET /document/statements/:leadId
export const getStatements = async (req: Request, res: Response): Promise<any> => {
  try {
    const { leadId } = req.params;
    if (!leadId) return res.status(400).json(errorWithoutData("leadId is required"));

    const response = await documentService.getStatements(leadId);
    return res.status(response.result ? 200 : 404).json(response);
  } catch (error: any) {
    console.error("Error in getStatements:", error.message);
    return res.status(500).json(errorWithoutData("Internal server error"));
  }
};

// DELETE /document/statements/:leadId/:documentId
export const deleteStatement = async (req: Request, res: Response): Promise<any> => {
  try {
    const { leadId, documentId } = req.params;
    if (!leadId || !documentId) {
      return res.status(400).json(errorWithoutData("leadId and documentId are required"));
    }

    const response = await documentService.deleteStatement(documentId, leadId);
    return res.status(response.result ? 200 : 404).json(response);
  } catch (error: any) {
    console.error("Error in deleteStatement:", error.message);
    return res.status(500).json(errorWithoutData("Internal server error"));
  }
};
