import pino from "pino";
import { z } from "zod";
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: process.env.SERVICE_NAME || "playza" },
  redact: ["authorization", "password", "token", "secret"],
});
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_ENV: z.enum(["local", "staging", "production"]).default("local"),
  DATABASE_URL: z
    .string()
    .url()
    .refine((v) => /^postgres(ql)?:/.test(v)),
  REDIS_URL: z
    .string()
    .url()
    .refine((v) => /^rediss?:/.test(v))
    .optional(),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
  BOOKING_TAX_BPS: z.coerce.number().int().min(0).max(10000).default(0),
  BOOKING_FEE_MINOR: z.coerce.number().int().min(0).max(100000000).default(0),
  POSTGRES_API_PORT: z.coerce.number().int().min(1).max(65535).default(8001),
  ALLOWED_ORIGINS: z.string().default(""),
  JWT_SECRET: z.string().min(32).optional(),
  REFRESH_TOKEN_SECRET: z.string().min(32).optional(),
  OTP_SECRET: z.string().min(32).optional(),
});
export function runtimeEnv(role: "api" | "worker") {
  const result = schema.safeParse(process.env);
  if (!result.success)
    throw new Error(
      `Invalid environment keys: ${result.error.issues.map((i) => i.path.join(".")).join(", ")}`,
    );
  const env = result.data;
  if (role === "api") {
    if (!env.JWT_SECRET || !env.REFRESH_TOKEN_SECRET || !env.OTP_SECRET)
      throw new Error("API authentication secrets are required");
    if (
      new Set([env.JWT_SECRET, env.REFRESH_TOKEN_SECRET, env.OTP_SECRET])
        .size !== 3
    )
      throw new Error("Authentication secrets must be distinct");
  }
  for (const origin of env.ALLOWED_ORIGINS.split(",")
    .map((v) => v.trim())
    .filter(Boolean)) {
    const url = new URL(origin);
    if (
      url.origin !== origin ||
      (env.NODE_ENV === "production" && url.protocol !== "https:")
    )
      throw new Error(
        "Allowed origins must be exact origins; deployed origins require HTTPS",
      );
  }
  if (env.NODE_ENV === "production") {
    const required =
      role === "api"
        ? [
            "REDIS_URL",
            "EMAIL_USER",
            "EMAIL_PASS",
            "CLOUDINARY_CLOUD_NAME",
            "CLOUDINARY_API_KEY",
            "CLOUDINARY_API_SECRET",
            "RAZORPAY_KEY_ID",
            "RAZORPAY_KEY_SECRET",
            "RAZORPAY_WEBHOOK_SECRET",
            "ALLOWED_ORIGINS",
          ]
        : ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];
    const missing = required.filter((key) => !process.env[key]?.trim());
    if (missing.length)
      throw new Error(`Missing deployment keys: ${missing.join(", ")}`);
    if (env.APP_ENV === "local")
      throw new Error(
        "Set APP_ENV to staging or production for deployed processes",
      );
    const prefix = env.APP_ENV === "production" ? "rzp_live_" : "rzp_test_";
    if (!process.env.RAZORPAY_KEY_ID?.startsWith(prefix))
      throw new Error("Razorpay key mode does not match APP_ENV");
  }
  return env;
}
