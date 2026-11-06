import { bill, BillingOptions } from "../pricing/billing";
import { quote } from "../pricing/quote";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";

export class ReservationError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}
export interface ReserveCommand {
  customerId: string;
  resourceId: string;
  sportId: string;
  startsAt: Date;
  endsAt: Date;
  participants: number;
  idempotencyKey: string;
  couponCode?: string;
}

const localTime = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return {
    day: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      get("weekday"),
    ),
    minute: Number(get("hour")) * 60 + Number(get("minute")),
  };
};

const matchesCommand = <
  T extends {
    customerId: string;
    resourceId: string;
    startsAt: Date;
    endsAt: Date;
    participants: number;
    priceSnapshot: Prisma.JsonValue;
  },
>(
  booking: T,
  input: ReserveCommand,
) => {
  const snapshot = booking.priceSnapshot as Prisma.JsonObject;
  if (
    booking.customerId !== input.customerId ||
    booking.resourceId !== input.resourceId ||
    booking.startsAt.getTime() !== input.startsAt.getTime() ||
    booking.endsAt.getTime() !== input.endsAt.getTime() ||
    booking.participants !== input.participants ||
    snapshot.sportId !== input.sportId ||
    (snapshot.couponCode || null) !== (input.couponCode?.toUpperCase() || null)
  )
    throw new ReservationError(
      409,
      "Idempotency key was used for another request",
    );
  return booking;
};

/** Internal application service. Prices are read from PostgreSQL, never accepted from a client. */
export class ReservationService {
  constructor(
    private db: PrismaClient,
    private billing: BillingOptions = {},
  ) {}

  async reserve(input: ReserveCommand) {
    const { startsAt, endsAt } = input;
    if (
      !Number.isFinite(startsAt.getTime()) ||
      !Number.isFinite(endsAt.getTime()) ||
      endsAt <= startsAt ||
      startsAt <= new Date() ||
      !Number.isSafeInteger(input.participants) ||
      input.participants <= 0 ||
      input.idempotencyKey.length < 8 ||
      input.idempotencyKey.length > 200
    ) {
      throw new ReservationError(
        400,
        "Invalid reservation interval, participants or idempotency key",
      );
    }
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await this.db.$transaction(
          async (tx) => {
            const customer = await tx.user.findUnique({
              where: { id: input.customerId },
            });
            if (
              !customer ||
              customer.isBlocked ||
              customer.deletedAt ||
              !customer.isVerified
            ) {
              throw new ReservationError(
                403,
                "Customer account cannot make bookings",
              );
            }
            const existing = await tx.booking.findUnique({
              where: { idempotencyKey: input.idempotencyKey },
            });
            if (existing) return matchesCommand(existing, input);
            await tx.$queryRaw`SELECT id FROM "Resource" WHERE id=${input.resourceId}::uuid FOR UPDATE`;
            const resource = await tx.resource.findUnique({
              where: { id: input.resourceId },
              include: {
                facility: { include: { venue: true } },
                operatingHour_resource: true,
                pricingRule_resource: {
                  orderBy: [{ priority: "desc" }, { id: "asc" }],
                },
                resourceSport_resource: true,
              },
            });
            if (
              !resource ||
              !resource.isActive ||
              !resource.facility.isActive ||
              !resource.facility.venue.isActive ||
              resource.facility.venue.deletedAt ||
              resource.facility.venue.status !== "APPROVED"
            )
              throw new ReservationError(404, "Resource unavailable");
            const offered = resource.resourceSport_resource.some(
              (sport) => sport.sportId === input.sportId,
            );
            const sport = await tx.sport.findUnique({
              where: { id: input.sportId },
            });
            if (!offered || !sport?.isActive)
              throw new ReservationError(
                400,
                "Sport unavailable for this resource",
              );
            if (input.participants > resource.capacity)
              throw new ReservationError(409, "Participant capacity exceeded");
            const duration = (endsAt.getTime() - startsAt.getTime()) / 60000;
            if (
              startsAt.getUTCSeconds() ||
              endsAt.getUTCSeconds() ||
              startsAt.getUTCMilliseconds() ||
              endsAt.getUTCMilliseconds() ||
              duration % resource.slotMinutes !== 0
            ) {
              throw new ReservationError(
                400,
                "Interval must use the resource's booking duration",
              );
            }
            const start = localTime(startsAt, resource.facility.venue.timezone);
            const end = localTime(endsAt, resource.facility.venue.timezone);
            if (
              end.minute === 0 &&
              localTime(
                new Date(endsAt.getTime() - 1),
                resource.facility.venue.timezone,
              ).day === start.day
            ) {
              end.day = start.day;
              end.minute = 1440;
            }
            if (
              start.day !== end.day ||
              !resource.operatingHour_resource.some(
                (hour) =>
                  hour.weekday === start.weekday &&
                  start.minute >= hour.opensMinute &&
                  end.minute <= hour.closesMinute &&
                  (start.minute - hour.opensMinute) % resource.slotMinutes ===
                    0,
              )
            ) {
              throw new ReservationError(
                409,
                "Interval is outside resource operating hours",
              );
            }
            const blocked = await tx.availabilityException.findFirst({
              where: {
                resourceId: resource.id,
                startsAt: { lt: endsAt },
                endsAt: { gt: startsAt },
              },
            });
            if (blocked)
              throw new ReservationError(
                409,
                "Resource is unavailable during this interval",
              );
            let calculated: ReturnType<typeof quote>;
            try {
              calculated = quote({
                startsAt,
                endsAt,
                slotMinutes: resource.slotMinutes,
                timezone: resource.facility.venue.timezone,
                participants: input.participants,
                mode: resource.mode,
                rules: resource.pricingRule_resource,
              });
            } catch (error) {
              throw new ReservationError(
                409,
                error instanceof Error ? error.message : "Price unavailable",
              );
            }
            const { totalMinor, multiplier } = calculated;
            const billed = await bill(
              tx,
              {
                subtotalMinor: totalMinor,
                venueId: resource.facility.venueId,
                customerId: input.customerId,
                couponCode: input.couponCode,
              },
              this.billing,
            );
            let capacitySessionId: string | undefined;
            if (resource.mode === "CAPACITY_BASED") {
              const session = await tx.capacitySession.findUnique({
                where: {
                  resourceId_startsAt_endsAt: {
                    resourceId: resource.id,
                    startsAt,
                    endsAt,
                  },
                },
              });
              if (!session)
                throw new ReservationError(409, "Session unavailable");
              const result = await tx.capacitySession.updateMany({
                where: {
                  id: session.id,
                  reserved: { lte: session.capacity - input.participants },
                },
                data: { reserved: { increment: input.participants } },
              });
              if (result.count !== 1)
                throw new ReservationError(409, "Session is full");
              capacitySessionId = session.id;
            }
            const booking = await tx.booking.create({
              data: {
                reference: `PZ-${randomUUID()}`,
                customerId: input.customerId,
                resourceId: resource.id,
                startsAt,
                endsAt,
                participants: input.participants,
                capacitySessionId,
                status: billed.totalMinor === 0 ? "CONFIRMED" : "HELD",
                holdExpiresAt:
                  billed.totalMinor === 0
                    ? null
                    : new Date(Date.now() + 15 * 60 * 1000),
                subtotalMinor: billed.subtotalMinor,
                taxMinor: billed.taxMinor,
                feeMinor: billed.feeMinor,
                discountMinor: billed.discountMinor,
                totalMinor: billed.totalMinor,
                currency: resource.currency,
                idempotencyKey: input.idempotencyKey,
                priceSnapshot: {
                  lines: calculated.lines,
                  multiplier,
                  slotMinutes: resource.slotMinutes,
                  sportId: input.sportId,
                  couponCode: input.couponCode?.toUpperCase() || null,
                  taxBasisPoints: billed.taxBasisPoints,
                  cancellationPolicy: "FULL_REFUND_24_HOURS",
                },
              },
            });
            if (billed.couponId)
              await tx.couponRedemption.create({
                data: {
                  couponId: billed.couponId,
                  bookingId: booking.id,
                  userId: input.customerId,
                  discountMinor: billed.discountMinor,
                },
              });
            if (resource.mode === "EXCLUSIVE")
              await tx.resourceReservation.create({
                data: {
                  resourceId: resource.id,
                  bookingId: booking.id,
                  startsAt,
                  endsAt,
                },
              });
            await tx.outboxEvent.create({
              data: {
                topic:
                  billed.totalMinor === 0
                    ? "booking.confirmed"
                    : "booking.held",
                aggregateId: booking.id,
                payload: {
                  bookingId: booking.id,
                  customerId: input.customerId,
                },
              },
            });
            return booking;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        const transient =
          error instanceof Error &&
          (/\b(40P01|40001)\b|deadlock detected/.test(error.message) ||
            (error instanceof Prisma.PrismaClientKnownRequestError &&
              ["P2034", "P2002"].includes(error.code)));
        if (transient) {
          if (attempt < 3) {
            await new Promise((resolve) =>
              setTimeout(resolve, 10 * (attempt + 1)),
            );
            continue;
          }
          throw new ReservationError(
            409,
            "Reservation conflicted; retry with the same idempotency key",
          );
        }
        if (
          error instanceof Error &&
          /resource_no_overlap|exclusion constraint/.test(error.message)
        ) {
          throw new ReservationError(409, "Resource is already reserved");
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (["P2034", "P2002"].includes(error.code) && attempt < 3) continue;
          if (
            error.code === "P2004" ||
            error.message.includes("resource_no_overlap")
          ) {
            throw new ReservationError(409, "Resource is already reserved");
          }
        }
        throw error;
      }
    }
    throw new ReservationError(
      409,
      "Reservation conflicted; retry with the same idempotency key",
    );
  }

  async cancelHold(customerId: string, bookingId: string) {
    return this.db.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, customerId },
      });
      if (!booking) throw new ReservationError(404, "Booking not found");
      if (booking.status === "CANCELLED") return booking;
      const cancelled = await tx.booking.updateMany({
        where: { id: bookingId, status: { in: ["HELD", "PAYMENT_PENDING"] } },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: "Customer cancelled unpaid hold",
        },
      });
      if (cancelled.count !== 1)
        throw new ReservationError(
          409,
          "Only unpaid holds can be cancelled here",
        );
      await tx.resourceReservation.updateMany({
        where: { bookingId },
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
          aggregateId: bookingId,
          payload: { bookingId },
        },
      });
      return tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
    });
  }

  async expireDueHolds(limit = 100) {
    const due = await this.db.booking.findMany({
      where: {
        status: { in: ["HELD", "PAYMENT_PENDING"] },
        holdExpiresAt: { lte: new Date() },
      },
      take: limit,
      orderBy: { holdExpiresAt: "asc" },
      select: { id: true },
    });
    let expired = 0;
    for (const booking of due) if (await this.expireHold(booking.id)) expired++;
    return expired;
  }

  async expireHold(bookingId: string) {
    return this.db.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking) return false;
      const transitioned = await tx.booking.updateMany({
        where: {
          id: bookingId,
          status: { in: ["HELD", "PAYMENT_PENDING"] },
          holdExpiresAt: { lte: new Date() },
        },
        data: { status: "EXPIRED" },
      });
      if (transitioned.count !== 1) return false;
      await tx.resourceReservation.updateMany({
        where: { bookingId },
        data: { isBlocking: false },
      });
      if (booking.capacitySessionId)
        await tx.capacitySession.update({
          where: { id: booking.capacitySessionId },
          data: { reserved: { decrement: booking.participants } },
        });
      await tx.outboxEvent.create({
        data: {
          topic: "booking.expired",
          aggregateId: bookingId,
          payload: { bookingId },
        },
      });
      return true;
    });
  }
}
