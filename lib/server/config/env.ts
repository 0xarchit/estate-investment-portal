import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/estate-portal"),
  JWT_SECRET: z.string().min(16).default("development-jwt-secret-key-32-chars-long-minimum!"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default("demo-cloud"),
  CLOUDINARY_API_KEY: z.string().optional().default("123456789012345"),
  CLOUDINARY_API_SECRET: z.string().optional().default("abcdefghijklmnopqrstuvwxyz12"),
  RAZORPAY_KEY_ID: z.string().optional().default("rzp_test_placeholder"),
  RAZORPAY_KEY_SECRET: z.string().optional().default("rzp_secret_placeholder"),
  MOCK_GATEWAY_SECRET: z.string().default("mock-payment-gateway-secret-for-timing-safe-hmac"),
  PLATFORM_FEE_PCT: z.coerce.number().min(0).max(20).default(2),
  BROKER_COMMISSION_PCT: z.coerce.number().min(0).max(10).default(1),
  MAX_OWNERSHIP_PCT: z.coerce.number().min(1).max(100).default(49),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment variables");
  }
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : envSchema.parse({
      ...process.env,
      MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/estate-portal",
      JWT_SECRET: process.env.JWT_SECRET || "development-jwt-secret-key-32-chars-long-minimum!",
    });
