import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "./s3Bucket";

const bucketName = process.env.AWS_BUCKET_NAME!;

// Function to configure multer for image uploads only
const uploadImageToS3 = (eventFolder: string,fileSizeLimit = 5* 1024* 1024) => {
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
        // Store image in the appropriate folder
        const folderPath = `${eventFolder}/s`;

        cb(null, `${folderPath}/${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`);
      },
    }),
    limits: { fileSize: fileSizeLimit }, // Use dynamic file size limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    },
  });
};

export default uploadImageToS3;
