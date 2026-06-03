import dotenv from "dotenv";

dotenv.config();

const required = (key) => {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 4000,
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant_reviews",
  jwtSecret: required("JWT_SECRET") || "development_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
};
