import multer from "multer";

// Use memory storage for XLSX parsing from buffer
const storage = multer.memoryStorage();

// Take max file size directly from env (in bytes)
const MAX_FILE_SIZE_BYTES = Number(process.env.EXCEL_MAX_FILE_SIZE_BYTES);

if (!MAX_FILE_SIZE_BYTES) {
  throw new Error("Please set EXCEL_MAX_FILE_SIZE_BYTES in your .env file");
}

const excelUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

export default excelUpload;
