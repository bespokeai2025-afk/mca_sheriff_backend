// multerConfig.ts

import multer from "multer"; // Import multer for handling file uploads
import multerS3 from "multer-s3"; // Import multer-s3 for S3 storage
import s3 from "./s3Bucket"; // Import the configured S3 client

// Get the bucket name from environment variables
const bucketName = process.env.AWS_BUCKET_NAME!;

// Configure multer for file uploads to S3
const upload = multer({
  storage: multerS3({
    s3, // S3 client
    bucket: bucketName, // S3 bucket name
    // contentDisposition: "inline", // Set content disposition
    contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set the content type
    contentDisposition: 'inline', // Set content disposition to inline for images
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname }); // Set metadata
    },
    key: (req, file, cb) => {
      cb(null, `categories/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`); // Set the file key
    },
  }),
});

// Export the configured multer instance
export default upload;