import { isDeepStrictEqual } from "node:util";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PrismaClient, Prisma } from "@prisma/client";
import { ReservationError } from "../reservations/reservation.service";
export interface GatewayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
}
export interface PaymentGateway {
  createOrder(input: {
    amount: number;
    currency: string;
    receipt: string;
  }): Promise<{ id: string; amount: number; currency: string }>;
  fetchPayment(id: string): Promise<GatewayPayment>;
  findOrder?(
    receipt: string,
  ): Promise<{ id: string; amount: number; currency: string } | null>;
  orderPayments?(orderId: string): Promise<GatewayPayment[]>;
  findRefund?(
    paymentId: string,
    receipt: string,
  ): Promise<{
    id: string;
    payment_id: string;
    amount: number;
    status: string;
  } | null>;
  refund(
    id: string,
    input: { amount: number; receipt: string },
  ): Promise<{ id: string; status: string }>;
}
export interface PaymentOptions {
  gateway?: PaymentGateway;
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
}
function signature(secret: string, raw: Buffer | string, provided: string) {
  if (!/^[a-f0-9]{64}$/i.test(provided)) return false;
  return timingSafeEqual(
    createHmac("sha256", secret).update(raw).digest(),
    Buffer.from(provided, "hex"),
  );
}
export class PaymentService {
  constructor(
    private db: PrismaClient,
    private options: PaymentOptions,
  ) {}
  private gateway() {
    if (!this.options.gateway)
      throw new ReservationError(503, "Payment provider is not configured");
    return this.options.gateway;
  }
  async order(actor: string, bookingId: string, key: string) {
    const gateway = this.gateway();
    const result = await this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${bookingId}::uuid FOR UPDATE`;
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.customerId !== actor)
        throw new ReservationError(404, "Booking not found");
      if (
        !["HELD", "PAYMENT_PENDING"].includes(booking.status) ||
        !booking.holdExpiresAt ||
        booking.holdExpiresAt <= new Date()
      )
        throw new ReservationError(
          409,
          "Booking hold expired or is not payable",
        );
      const existing = await tx.payment.findFirst({
        where: {
          bookingId,
          status: { in: ["PENDING", "AUTHORIZED", "CAPTURED"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (existing) return { payment: existing, created: false };
      const payment = await tx.payment.create({
        data: {
          bookingId,
          amountMinor: booking.totalMinor,
          currency: booking.currency,
          idempotencyKey: `${actor}:${key}`,
        },
      });
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "PAYMENT_PENDING" },
      });
      return { payment, created: true };
    });
    if (!result.created) {
      if (!result.payment.providerOrderId)
        throw new ReservationError(
          409,
          "Payment order is being prepared or reconciled",
        );
      return { ...result.payment, keyId: this.options.keyId };
    }
    let order;
    try {
      order = await gateway.createOrder({
        amount: result.payment.amountMinor,
        currency: result.payment.currency,
        receipt: `PZ-${result.payment.id}`,
      });
    } catch {
      await this.db.payment.update({
        where: { id: result.payment.id },
        data: { metadata: { reconciliationRequired: true } },
      });
      throw new ReservationError(
        502,
        "Order creation requires reconciliation; no duplicate order was created locally",
      );
    }
    if (
      order.amount !== result.payment.amountMinor ||
      order.currency !== result.payment.currency
    )
      throw new ReservationError(502, "Provider order amount mismatch");
    const payment = await this.db.payment.update({
      where: { id: result.payment.id },
      data: { providerOrderId: order.id },
    });
    return { ...payment, keyId: this.options.keyId };
  }
  async verify(
    actor: string,
    input: {
      paymentId: string;
      gatewayPaymentId: string;
      gatewayOrderId: string;
      signature: string;
    },
  ) {
    const payment = await this.db.payment.findUnique({
      where: { id: input.paymentId },
      include: { booking: true },
    });
    if (!payment || payment.booking.customerId !== actor)
      throw new ReservationError(404, "Payment not found");
    if (
      !this.options.keySecret ||
      payment.providerOrderId !== input.gatewayOrderId ||
      !signature(
        this.options.keySecret,
        `${payment.providerOrderId}|${input.gatewayPaymentId}`,
        input.signature,
      )
    )
      throw new ReservationError(400, "Invalid payment verification");
    const captured = await this.gateway().fetchPayment(input.gatewayPaymentId);
    return this.capture(captured);
  }
  async capture(entity: GatewayPayment) {
    return this.db.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { providerOrderId: entity.order_id },
      });
      if (!payment) throw new ReservationError(404, "Payment order not found");
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${payment.bookingId}::uuid FOR UPDATE`;
      const booking = await tx.booking.findUniqueOrThrow({
        where: { id: payment.bookingId },
      });
      if (
        entity.status !== "captured" ||
        entity.amount !== payment.amountMinor ||
        entity.currency !== payment.currency
      )
        throw new ReservationError(
          400,
          "Provider capture does not match the order",
        );
      const current = await tx.payment.findUniqueOrThrow({
        where: { id: payment.id },
      });
      if (current.providerPaymentId && current.providerPaymentId !== entity.id)
        throw new ReservationError(
          409,
          "Order already has a different payment",
        );
      if (
        ["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(current.status)
      )
        return { payment: current, booking };
      const eligible =
        ["HELD", "PAYMENT_PENDING"].includes(booking.status) &&
        !!booking.holdExpiresAt &&
        booking.holdExpiresAt > new Date();
      const captured = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "CAPTURED",
          providerPaymentId: entity.id,
          paidAt: new Date(),
          metadata: eligible ? {} : { requiresRefund: true },
        },
      });
      if (eligible) {
        const confirmed = await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CONFIRMED" },
        });
        await tx.outboxEvent.create({
          data: {
            topic: "booking.confirmed",
            aggregateId: booking.id,
            payload: { bookingId: booking.id, paymentId: payment.id },
          },
        });
        return { payment: captured, booking: confirmed };
      }
      // A late payment cannot resurrect an expired or released allocation.
      await tx.outboxEvent.create({
        data: {
          topic: "payment.late_capture",
          aggregateId: payment.id,
          payload: { paymentId: payment.id, bookingId: booking.id },
        },
      });
      return { payment: captured, booking };
    });
  }
  async webhook(raw: Buffer, provided: string, eventId: string) {
    if (
      !Buffer.isBuffer(raw) ||
      !this.options.webhookSecret ||
      !signature(this.options.webhookSecret, raw, provided)
    )
      throw new ReservationError(400, "Invalid webhook signature");
    let data: {
      event: string;
      payload: {
        payment?: { entity: GatewayPayment };
        refund?: {
          entity: {
            id: string;
            payment_id: string;
            amount: number;
            status: string;
          };
        };
      };
    };
    try {
      data = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new ReservationError(400, "Invalid webhook JSON");
    }
    if (typeof data.event !== "string" || !data.payload)
      throw new ReservationError(400, "Invalid webhook event");
    const receipt = await this.db.paymentWebhookEvent.upsert({
      where: {
        provider_providerEventId: {
          provider: "razorpay",
          providerEventId: eventId,
        },
      },
      create: {
        provider: "razorpay",
        providerEventId: eventId,
        payload: JSON.parse(raw.toString("utf8")),
      },
      update: {},
    });
    if (!isDeepStrictEqual(receipt.payload, JSON.parse(raw.toString("utf8"))))
      throw new ReservationError(
        409,
        "Webhook event identifier was reused with different data",
      );
    if (receipt.processedAt) return { received: true };
    if (data.event === "payment.captured" && data.payload.payment)
      await this.capture(data.payload.payment.entity);
    if (data.event === "refund.processed" && data.payload.refund)
      await this.processRefund(data.payload.refund.entity);
    if (data.event === "payment.failed" && data.payload.payment) {
      const entity = data.payload.payment.entity;
      await this.db.payment.updateMany({
        where: {
          providerOrderId: entity.order_id,
          status: { in: ["PENDING", "AUTHORIZED"] },
        },
        data: { status: "FAILED" },
      });
    }
    await this.db.paymentWebhookEvent.update({
      where: { id: receipt.id },
      data: { processedAt: new Date() },
    });
    return { received: true };
  }
  async refund(
    paymentId: string,
    amountMinor: number,
    reason: string,
    key: string,
  ) {
    const gateway = this.gateway();
    const result = await this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Payment" WHERE id=${paymentId}::uuid FOR UPDATE`;
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new ReservationError(404, "Payment not found");
      const existing = await tx.refund.findUnique({
        where: { idempotencyKey: key },
      });
      if (existing) {
        if (
          existing.paymentId !== paymentId ||
          existing.amountMinor !== amountMinor
        )
          throw new ReservationError(409, "Refund key already used");
        return { refund: existing, payment, created: false };
      }
      if (
        !["CAPTURED", "PARTIALLY_REFUNDED"].includes(payment.status) ||
        !payment.providerPaymentId
      )
        throw new ReservationError(409, "Payment cannot be refunded");
      const reserved = await tx.refund.aggregate({
        where: { paymentId, status: { in: ["PENDING", "PROCESSED"] } },
        _sum: { amountMinor: true },
      });
      if (
        amountMinor <= 0 ||
        amountMinor + (reserved._sum.amountMinor || 0) > payment.amountMinor
      )
        throw new ReservationError(409, "Refund exceeds remaining paid amount");
      return {
        refund: await tx.refund.create({
          data: { paymentId, amountMinor, reason, idempotencyKey: key },
        }),
        payment,
        created: true,
      };
    });
    if (!result.created) return result.refund;
    let refund;
    try {
      refund = await gateway.refund(result.payment.providerPaymentId!, {
        amount: amountMinor,
        receipt: result.refund.id,
      });
    } catch {
      throw new ReservationError(
        502,
        "Refund is pending reconciliation; do not create another refund request",
      );
    }
    await this.db.refund.update({
      where: { id: result.refund.id },
      data: { providerRefundId: refund.id },
    });
    if (refund.status === "processed")
      await this.processRefund({
        id: refund.id,
        payment_id: result.payment.providerPaymentId!,
        amount: amountMinor,
        status: "processed",
      });
    return this.db.refund.findUniqueOrThrow({
      where: { id: result.refund.id },
    });
  }
  async reconcile(limit = 50) {
    const gateway = this.gateway();
    const unresolved = await this.db.payment.findMany({
      where: {
        status: { in: ["PENDING", "AUTHORIZED"] },
        createdAt: { lt: new Date(Date.now() - 60000) },
      },
      orderBy: { updatedAt: "asc" },
      take: limit,
    });
    for (const payment of unresolved) {
      try {
        let orderId = payment.providerOrderId;
        if (!orderId && gateway.findOrder) {
          const found = await gateway.findOrder(`PZ-${payment.id}`);
          if (found) {
            if (
              found.amount !== payment.amountMinor ||
              found.currency !== payment.currency
            )
              throw new ReservationError(
                409,
                "Provider order reconciliation mismatch",
              );
            await this.db.payment.updateMany({
              where: { id: payment.id, providerOrderId: null },
              data: {
                providerOrderId: found.id,
                metadata: { reconciliationRequired: false },
              },
            });
            orderId = found.id;
          }
        }
        if (orderId && gateway.orderPayments) {
          const captured = (await gateway.orderPayments(orderId)).filter(
            (item) => item.status === "captured",
          );
          if (captured.length > 1)
            throw new ReservationError(
              409,
              "Multiple captured payments require operator review",
            );
          if (captured[0]) {
            if (captured[0].order_id !== orderId)
              throw new ReservationError(
                409,
                "Provider order payment mismatch",
              );
            await this.capture(captured[0]);
          }
        }
      } catch {
        await this.db.payment.update({
          where: { id: payment.id },
          data: {
            metadata: {
              ...(payment.metadata as Prisma.JsonObject),
              reconciliationRequired: true,
              lastReconciledAt: new Date().toISOString(),
            },
          },
        });
      }
    }
    const pending = await this.db.refund.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: new Date(Date.now() - 60000) },
      },
      include: { payment: true },
      take: limit,
      orderBy: { createdAt: "asc" },
    });
    if (gateway.findRefund)
      for (const request of pending) {
        if (!request.payment.providerPaymentId) continue;
        const remote = await gateway.findRefund(
          request.payment.providerPaymentId,
          request.id,
        );
        if (!remote) continue; // An ambiguous request is never issued twice automatically.
        if (
          remote.payment_id !== request.payment.providerPaymentId ||
          remote.amount !== request.amountMinor
        )
          throw new ReservationError(409, "Refund reconciliation mismatch");
        await this.db.refund.updateMany({
          where: {
            id: request.id,
            status: "PENDING",
            OR: [{ providerRefundId: null }, { providerRefundId: remote.id }],
          },
          data: { providerRefundId: remote.id },
        });
        if (remote.status === "processed") await this.processRefund(remote);
        else if (remote.status === "failed")
          await this.db.refund.updateMany({
            where: { id: request.id, status: "PENDING" },
            data: { status: "FAILED" },
          });
      }
    const events = await this.db.outboxEvent.findMany({
      where: {
        topic: {
          in: ["payment.late_capture", "payment.customer_cancellation"],
        },
        processedAt: null,
        availableAt: { lte: new Date() },
      },
      take: limit,
      orderBy: { createdAt: "asc" },
    });
    for (const event of events) {
      try {
        const payment = await this.db.payment.findUniqueOrThrow({
          where: { id: event.aggregateId },
        });
        if (payment.status !== "REFUNDED") {
          const key = `${event.topic}:${payment.id}`,
            existing = await this.db.refund.findUnique({
              where: { idempotencyKey: key },
            });
          if (!existing) {
            const reserved = await this.db.refund.aggregate({
              where: {
                paymentId: payment.id,
                status: { in: ["PENDING", "PROCESSED"] },
              },
              _sum: { amountMinor: true },
            });
            const remaining =
              payment.amountMinor - (reserved._sum.amountMinor || 0);
            if (remaining > 0)
              await this.refund(
                payment.id,
                remaining,
                event.topic === "payment.late_capture"
                  ? "Automatic refund of a payment captured after hold expiry"
                  : "Customer cancellation before the 24-hour refund cutoff",
                key,
              );
          }
        }
        const current = await this.db.payment.findUniqueOrThrow({
          where: { id: payment.id },
        });
        await this.db.outboxEvent.update({
          where: { id: event.id },
          data: {
            processedAt: current.status === "REFUNDED" ? new Date() : null,
            attempts: { increment: 1 },
            availableAt: new Date(Date.now() + 60000),
          },
        });
      } catch {
        await this.db.outboxEvent.update({
          where: { id: event.id },
          data: {
            attempts: { increment: 1 },
            availableAt: new Date(
              Date.now() +
                Math.min(3600000, 60000 * 2 ** Math.min(event.attempts, 6)),
            ),
          },
        });
      }
    }
  }
  async processRefund(entity: {
    id: string;
    payment_id: string;
    amount: number;
    status: string;
  }) {
    if (entity.status !== "processed") return;
    return this.db.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { providerPaymentId: entity.payment_id },
      });
      if (!payment) throw new ReservationError(404, "Refund payment not found");
      await tx.$queryRaw`SELECT id FROM "Payment" WHERE id=${payment.id}::uuid FOR UPDATE`;
      const refund = await tx.refund.findUnique({
        where: { providerRefundId: entity.id },
      });
      if (
        !refund ||
        refund.paymentId !== payment.id ||
        refund.amountMinor !== entity.amount
      )
        throw new ReservationError(
          409,
          "Refund requires reconciliation with a known request",
        );
      if (refund.status === "PROCESSED") return;
      await tx.refund.update({
        where: { id: refund.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
      const total = await tx.refund.aggregate({
        where: { paymentId: payment.id, status: "PROCESSED" },
        _sum: { amountMinor: true },
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status:
            total._sum.amountMinor === payment.amountMinor
              ? "REFUNDED"
              : "PARTIALLY_REFUNDED",
        },
      });
      await tx.outboxEvent.create({
        data: {
          topic: "refund.processed",
          aggregateId: refund.id,
          payload: { refundId: refund.id, paymentId: payment.id },
        },
      });
    });
  }
}
