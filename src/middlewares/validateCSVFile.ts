// import { Request, Response, NextFunction } from "express";

// export const validateExcelFile = (req: Request, res: Response, next: NextFunction): void => {
//   if (!req.file) {
//     res.status(400).json({
//       result: false,
//       message: "No file uploaded. Please upload an Excel file (.xlsx or .xls).",
//     });
//     return;
//   }

//   // Only allow Excel MIME types
//   const allowedMimeTypes = [
//     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
//     "application/vnd.ms-excel", // .xls
//   ];

//   if (!allowedMimeTypes.includes(req.file.mimetype)) {
//     res.status(400).json({
//       result: false,
//       message: "Invalid file type. Only Excel files (.xlsx or .xls) are allowed.",
//     });
//     return;
//   }

//   next();
// };
import { Request, Response, NextFunction } from "express";

export const validateCSVFile = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    res.status(400).json({
      result: false,
      message: "No file uploaded. Please upload a CSV file (.csv).",
    });
    return;
  }

  // Only allow CSV MIME type
  const allowedMimeTypes = ["text/csv"];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    res.status(400).json({
      result: false,
      message: "Invalid file type. Only CSV files (.csv) are allowed.",
    });
    return;
  }

  next();
};

