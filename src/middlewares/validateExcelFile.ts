import { Request, Response, NextFunction } from "express";

export const validateExcelFile = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    res.status(400).json({
      result: false,
      message: "No file uploaded. Please upload an Excel file (.xlsx or .xls).",
    });
    return;
  }

  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    res.status(400).json({
      result: false,
      message: "Invalid file type. Only Excel files (.xlsx or .xls) are allowed.",
    });
    return;
  }

  next();
};
