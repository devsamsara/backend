// src/config/aws.config.ts
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const requiredVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET!;

// Public base URL for the bucket.
// If you use CloudFront, replace this with your distribution URL.
export const S3_PUBLIC_URL =
  process.env.AWS_S3_PUBLIC_URL ??
  `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
