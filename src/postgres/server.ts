import { cloudinaryProvider } from "../features/media/cloudinary";
import Redis from "ioredis";
import { RedisStore } from "rate-limit-redis";
import { createAdapter } from "@socket.io/redis-adapter";
import "dotenv/config";
import { razorpayGateway } from "../features/finance/razorpay";
import { attachRealtime } from "../features/community/realtime";
import path from "node:path";
import { logger, runtimeEnv } from "./runtime";
import { prisma } from "../config/database/prisma";
import { createPostgresApp } from "./app";
import { ReservationService } from "../features/reservations/reservation.service";

const env = runtimeEnv("api");
const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
  : undefined;
const subscriber = redis?.duplicate({ lazyConnect: true });
redis?.on("error", () => logger.error({ event: "redis_unavailable" }));
subscriber?.on("error", () =>
  logger.error({ event: "redis_subscriber_unavailable" }),
);
const { sendEmail } = require(
  path.resolve(process.cwd(), "src/utils/sendEmail"),
) as {
  sendEmail: (input: {
    to: string;
    subject: string;
    html: string;
  }) => Promise<unknown>;
};
let draining = false;
let realtime: ReturnType<typeof attachRealtime> | undefined;
function buildApp() {
  return createPostgresApp(prisma, {
    isDraining: () => draining,
    checkReadiness: async () => {
      if (redis && (await redis.ping()) !== "PONG")
        throw new Error("Redis unavailable");
    },
    onRequest: (data) => logger.info(data, "request_complete"),
    billing: {
      taxBasisPoints: env.BOOKING_TAX_BPS,
      feeMinor: env.BOOKING_FEE_MINOR,
    },
    media:
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
        ? cloudinaryProvider(
            process.env.CLOUDINARY_CLOUD_NAME,
            process.env.CLOUDINARY_API_KEY,
            process.env.CLOUDINARY_API_SECRET,
          )
        : undefined,
    trustProxyHops: env.TRUST_PROXY_HOPS,
    rateLimitStore: redis
      ? (prefix) =>
          new RedisStore({
            prefix: `playza:limit:${prefix}:`,
            sendCommand: (...args: string[]) =>
              redis.call(...(args as [string, ...string[]])) as Promise<any>,
          })
      : undefined,
    payments: {
      gateway:
        process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
          ? razorpayGateway(
              process.env.RAZORPAY_KEY_ID,
              process.env.RAZORPAY_KEY_SECRET,
            )
          : undefined,
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    },
    accessSecret: env.JWT_SECRET!,
    refreshSecret: env.REFRESH_TOKEN_SECRET!,
    challengeSecret: env.OTP_SECRET!,
    onMessage: (conversationId, message) => {
      void realtime
        ?.broadcast(conversationId, message)
        .catch(() => console.error("Realtime delivery failed"));
    },
    allowedOrigins: env.ALLOWED_ORIGINS.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    deliverChallenge: async ({ email, code, purpose }) => {
      await sendEmail({
        to: email,
        subject:
          purpose === "EMAIL_VERIFICATION"
            ? "Verify your PLAYZA email"
            : "Reset your PLAYZA password",
        html: `<p>Your PLAYZA code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
      });
    },
    onError: (_error, requestId) =>
      console.error(
        JSON.stringify({ level: "error", event: "request_failed", requestId }),
      ),
  });
}
async function start() {
  await prisma.$connect();
  await Promise.all([redis?.connect(), subscriber?.connect()]);
  const app = buildApp();
  const server = app.listen(env.POSTGRES_API_PORT, () =>
    console.log(`PLAYZA PostgreSQL API listening on ${env.POSTGRES_API_PORT}`),
  );
  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  server.keepAliveTimeout = 5000;
  realtime = attachRealtime(
    server,
    prisma,
    {
      accessSecret: env.JWT_SECRET!,
      refreshSecret: env.REFRESH_TOKEN_SECRET!,
      challengeSecret: env.OTP_SECRET!,
      deliverChallenge: async () => {
        throw new Error("Not available over socket");
      },
    },
    env.ALLOWED_ORIGINS.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    redis && subscriber ? createAdapter(redis, subscriber) : undefined,
  );
  const reservations = new ReservationService(prisma);
  let activeSweep: Promise<unknown> | undefined;
  const sweep = setInterval(() => {
    if (activeSweep) return;
    activeSweep = reservations
      .expireDueHolds()
      .catch(() => console.error("Hold expiry sweep failed"))
      .finally(() => {
        activeSweep = undefined;
      });
  }, 30000);
  sweep.unref();
  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    draining = true;
    clearInterval(sweep);
    realtime?.close();
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close(() => {
      void Promise.resolve(activeSweep)
        .then(() =>
          Promise.all([
            redis?.disconnect(),
            subscriber?.disconnect(),
            prisma.$disconnect(),
          ]),
        )
        .then(() => {
          clearTimeout(deadline);
          process.exit(process.exitCode || 0);
        });
    });
  };
  process.on("uncaughtException", () => {
    process.exitCode = 1;
    logger.fatal({ event: "uncaught_exception" });
    shutdown();
  });
  process.on("unhandledRejection", () => {
    process.exitCode = 1;
    logger.fatal({ event: "unhandled_rejection" });
    shutdown();
  });
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
void start().catch(async () => {
  console.error("PLAYZA PostgreSQL startup failed");
  redis?.disconnect();
  subscriber?.disconnect();
  await prisma.$disconnect();
  process.exitCode = 1;
});
