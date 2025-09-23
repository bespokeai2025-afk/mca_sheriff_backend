import { Request, Response, NextFunction } from "express";
import multer from "multer";

// Middleware to handle Multer file upload errors
const multerErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "File size must be less than 500KB!" });
      return;
    }
  }
  next(err);
};

export default multerErrorHandler;
