import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  COGNODB_URI: process.env.COGNODB_URI || "bolt://localhost:7687",
  COGNODB_USER: process.env.COGNODB_USER || "cognodb",
  COGNODB_PASSWORD: process.env.COGNODB_PASSWORD || "",
} as const;

export type Config = typeof config;
