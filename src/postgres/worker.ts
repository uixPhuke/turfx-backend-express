import {
  PushService,
  expoPushProvider,
} from "../features/notifications/push.service";
import { PaymentService } from "../features/finance/payment.service";
import { razorpayGateway } from "../features/finance/razorpay";
import "dotenv/config";
import { prisma } from "../config/database/prisma";
import { OutboxService } from "../features/jobs/outbox.service";
import { ReservationService } from "../features/reservations/reservation.service";
import { runtimeEnv, logger } from "./runtime";
runtimeEnv("worker");
const outbox = new OutboxService(prisma),
  reservations = new ReservationService(prisma);
const finance =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new PaymentService(prisma, {
        gateway: razorpayGateway(
          process.env.RAZORPAY_KEY_ID,
          process.env.RAZORPAY_KEY_SECRET,
        ),
      })
    : undefined;
const push = new PushService(
  prisma,
  expoPushProvider(process.env.EXPO_ACCESS_TOKEN),
);
let lastReconcile = 0;
let stopping = false,
  active: Promise<unknown> | undefined;
async function tick() {
  if (stopping || active) return;
  active = (async () => {
    await reservations
      .expireDueHolds()
      .catch(() => logger.error({ event: "expiry_iteration_failed" }));
    await outbox
      .drain()
      .catch(() => logger.error({ event: "outbox_iteration_failed" }));
    await push
      .tick()
      .catch(() =>
        console.error(
          JSON.stringify({ level: "error", event: "push_iteration_failed" }),
        ),
      );
    if (finance && Date.now() - lastReconcile > 60000) {
      lastReconcile = Date.now();
      await finance
        .reconcile()
        .catch(() => logger.error({ event: "payment_reconciliation_failed" }));
    }
  })()
    .catch(() =>
      console.error(
        JSON.stringify({ level: "error", event: "worker_iteration_failed" }),
      ),
    )
    .finally(() => {
      active = undefined;
    });
  await active;
}
const interval = setInterval(() => void tick(), 5000);
async function stop() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  clearInterval(interval);
  await active;
  await prisma.$disconnect();
  clearTimeout(deadline);
}
process.on("SIGTERM", () => void stop());
process.on("SIGINT", () => void stop());
void prisma
  .$connect()
  .then(() => tick())
  .catch(async () => {
    clearInterval(interval);
    console.error("PLAYZA worker startup failed");
    await prisma.$disconnect();
    process.exitCode = 1;
  });

process.on("uncaughtException", () => {
  logger.fatal({ event: "worker_uncaught_exception" });
  void stop().finally(() => {
    process.exitCode = 1;
  });
});
process.on("unhandledRejection", () => {
  logger.fatal({ event: "worker_unhandled_rejection" });
  void stop().finally(() => {
    process.exitCode = 1;
  });
});
