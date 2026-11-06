import { Booking, Prisma, PrismaClient } from "@prisma/client";
import { ReservationError } from "./reservation.service";
export class CancellationService {
  constructor(private db: PrismaClient) {}
  policy(booking: Booking, at = new Date()) {
    const snapshot = booking.priceSnapshot as Prisma.JsonObject;
    const prior = snapshot.cancellation as Prisma.JsonObject | undefined;
    const deadline = new Date(booking.startsAt.getTime() - 24 * 60 * 60 * 1000);
    return {
      cancellable:
        ["HELD", "PAYMENT_PENDING", "CONFIRMED"].includes(booking.status) &&
        booking.startsAt > at,
      refundEligible: prior ? prior.refundEligible === true : at <= deadline,
      refundDeadline: deadline.toISOString(),
      policy: "Full refund at least 24 hours before play; no refund afterward.",
    };
  }
  async preview(actor: string, id: string) {
    const booking = await this.db.booking.findFirst({
      where: { id, customerId: actor },
    });
    if (!booking) throw new ReservationError(404, "Booking not found");
    const policy = this.policy(booking);
    const paid = await this.db.payment.aggregate({
      where: {
        bookingId: id,
        status: { in: ["CAPTURED", "PARTIALLY_REFUNDED"] },
      },
      _sum: { amountMinor: true },
    });
    const refunded=await this.db.refund.aggregate({where:{payment:{bookingId:id,status:{in:["CAPTURED","PARTIALLY_REFUNDED"]}},status:{in:["PENDING","PROCESSED"]}},_sum:{amountMinor:true}});
    return {
      ...policy,
      refundMinor: policy.refundEligible
        ? Math.max(0,Math.min(booking.totalMinor, (paid._sum.amountMinor || 0)-(refunded._sum.amountMinor||0)))
        : 0,
      currency: booking.currency,
    };
  }
  async cancel(actor: string, id: string, reason: string) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${id}::uuid FOR UPDATE`;
      const booking = await tx.booking.findFirst({
        where: { id, customerId: actor },
      });
      if (!booking) throw new ReservationError(404, "Booking not found");
      if (booking.status === "CANCELLED") return booking;
      const at = new Date(),
        policy = this.policy(booking, at);
      if (!policy.cancellable)
        throw new ReservationError(409, "This booking cannot be cancelled");
      const result = await tx.booking.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: at,
          cancellationReason: reason,
          priceSnapshot: {
            ...(booking.priceSnapshot as Prisma.JsonObject),
            cancellation: {
              refundEligible: policy.refundEligible,
              refundDeadline: policy.refundDeadline,
              policy: policy.policy,
            },
          },
        },
      });
      await tx.resourceReservation.updateMany({
        where: { bookingId: id, isBlocking: true },
        data: { isBlocking: false },
      });
      if (booking.capacitySessionId)
        await tx.capacitySession.update({
          where: { id: booking.capacitySessionId },
          data: { reserved: { decrement: booking.participants } },
        });
      await tx.outboxEvent.create({
        data: {
          topic: "booking.cancelled",
          aggregateId: id,
          payload: { bookingId: id },
        },
      });
      if (policy.refundEligible && booking.status === "CONFIRMED") {
        const payments = await tx.payment.findMany({
          where: {
            bookingId: id,
            status: { in: ["CAPTURED", "PARTIALLY_REFUNDED"] },
          },
        });
        for (const payment of payments)
          await tx.outboxEvent.create({
            data: {
              topic: "payment.customer_cancellation",
              aggregateId: payment.id,
              payload: { paymentId: payment.id, bookingId: id },
            },
          });
      }
      // Games linked to a cancelled facility booking cannot continue advertising that reservation.
      const games = await tx.game.findMany({
        where: { bookingId: id },
        select: { id: true },
      });
      await tx.game.updateMany({
        where: { bookingId: id },
        data: { status: "CANCELLED" },
      });
      if (games.length)
        await tx.invitation.updateMany({
          where: {
            gameId: { in: games.map((game) => game.id) },
            status: "PENDING",
          },
          data: { status: "CANCELLED" },
        });
      return result;
    });
  }
}
