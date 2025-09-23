import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "./s3Bucket";

const bucketName = process.env.AWS_BUCKET_NAME!;

// Function to configure multer for image & PDF uploads with dynamic folder support
const uploadToS3 = (eventFolder: string) => {
  return multer({
    storage: multerS3({
      s3,
      bucket: bucketName,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      contentDisposition: "inline",
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        // Get file type
        const fileType = file.mimetype.startsWith("image/") ? "images" : "docs";

        // Store in a dynamically generated event folder
        const folderPath = `${eventFolder}/${fileType}`;

        cb(null, `${folderPath}/${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Only images and PDFs are allowed"));
      }
    },
  });
};

export default uploadToS3;
