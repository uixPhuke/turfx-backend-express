import { PrismaClient } from "@prisma/client";
/** Database-only delivery is committed with the acknowledgement, so retries cannot duplicate it. */
export class OutboxService {
  constructor(private db: PrismaClient) {}
  async deliverOne() {
    return this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string; topic: string; aggregateId: string }[]
      >`
        SELECT id, topic, "aggregateId" FROM "OutboxEvent"
        WHERE "processedAt" IS NULL AND "availableAt" <= now()
          AND topic IN ('booking.held','booking.confirmed','booking.cancelled','booking.expired','refund.processed')
        ORDER BY "createdAt", id FOR UPDATE SKIP LOCKED LIMIT 1`;
      const event = rows[0];
      if (!event) return false;
      const refund =
        event.topic === "refund.processed"
          ? await tx.refund.findUnique({
              where: { id: event.aggregateId },
              include: { payment: { include: { booking: true } } },
            })
          : null;
      const booking =
        refund?.payment.booking ||
        (await tx.booking.findUnique({ where: { id: event.aggregateId } }));
      if (!booking) throw new Error("Outbox booking unavailable");
      const titles: Record<string, string> = {
        "booking.held": "Your slot is held",
        "booking.confirmed": "Your booking is confirmed",
        "booking.cancelled": "Your booking was cancelled",
        "booking.expired": "Your booking hold expired",
        "refund.processed": "Your refund was processed",
      };
      await tx.notification.create({
        data: {
          receiverId: booking.customerId,
          kind: event.topic,
          title: titles[event.topic],
          body: `Booking ${booking.reference}`,
          data: { bookingId: booking.id, eventId: event.id },
        },
      });
      await tx.outboxEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date(), attempts: { increment: 1 } },
      });
      return true;
    });
  }
  async drain(limit = 100) {
    let count = 0;
    while (count < limit && (await this.deliverOne())) count++;
    return count;
  }
}
