import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { PaymentOptions, PaymentService } from "./payment.service";
import { PlatformService } from "../platform/platform.service";
export function paymentRoutes(
  db: PrismaClient,
  authenticate: RequestHandler,
  options: PaymentOptions,
) {
  const router = Router(),
    service = new PaymentService(db, options),
    platform = new PlatformService(db);
  const id = z.string().uuid();
  router.post("/payments/webhook", async (req, res) => {
    const signature = z
        .string()
        .length(64)
        .parse(req.get("x-razorpay-signature")),
      eventId = z
        .string()
        .min(1)
        .max(200)
        .parse(req.get("x-razorpay-event-id"));
    const raw = (req as typeof req & { rawBody: Buffer }).rawBody;
    res.json({
      success: true,
      data: await service.webhook(raw, signature, eventId),
    });
  });
  router.post("/payments/orders", authenticate, async (req, res) => {
    const input = z.strictObject({ bookingId: id }).parse(req.body),
      key = z.string().min(8).max(160).parse(req.get("Idempotency-Key"));
    res.status(201).json({
      success: true,
      data: await service.order(
        res.locals.identity.user.id,
        input.bookingId,
        key,
      ),
    });
  });
  router.post("/payments/verify", authenticate, async (req, res) => {
    const input = z
      .strictObject({
        paymentId: id,
        gatewayPaymentId: z.string().min(1).max(100),
        gatewayOrderId: z.string().min(1).max(100),
        signature: z.string().length(64),
      })
      .parse(req.body);
    res.json({
      success: true,
      data: await service.verify(res.locals.identity.user.id, input),
    });
  });
  router.get("/payments", authenticate, async (_req, res) => {
    res.json({
      success: true,
      data: await db.payment.findMany({
        where: { booking: { customerId: res.locals.identity.user.id } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    });
  });
  router.post("/admin/payments/:id/refund", authenticate, async (req, res) => {
    await platform.admin(res.locals.identity.user.id);
    const input = z
        .strictObject({
          amountMinor: z.number().int().positive(),
          reason: z.string().trim().min(5).max(1000),
        })
        .parse(req.body),
      key = z.string().min(8).max(160).parse(req.get("Idempotency-Key"));
    res.json({
      success: true,
      data: await service.refund(
        id.parse(req.params.id),
        input.amountMinor,
        input.reason,
        `${res.locals.identity.user.id}:${key}`,
      ),
    });
  });
  router.get("/admin/payments/issues", authenticate, async (_req, res) => {
    await platform.admin(res.locals.identity.user.id);
    const [payments, refunds] = await Promise.all([
      db.payment.findMany({
        where: {
          status: { in: ["PENDING", "AUTHORIZED"] },
          createdAt: { lt: new Date(Date.now() - 300000) },
        },
        orderBy: { updatedAt: "asc" },
        take: 100,
      }),
      db.refund.findMany({
        where: {
          status: "PENDING",
          createdAt: { lt: new Date(Date.now() - 600000) },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
    ]);
    res.json({ success: true, data: { payments, refunds } });
  });
  return router;
}
