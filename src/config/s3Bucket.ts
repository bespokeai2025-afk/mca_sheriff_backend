// s3Bucket.ts

import { S3Client } from "@aws-sdk/client-s3"; // Import S3Client from AWS SDK
import dotenv from "dotenv"; // Import dotenv to manage environment variables

// Load environment variables from .env file
dotenv.config();

// Create a new S3 client instance with the specified region and credentials
const s3 = new S3Client({
  region: process.env.AWS_REGION, // AWS region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!, // AWS access key ID
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!, // AWS secret access key
  },
});

// Export the configured S3 client instance
export default s3;