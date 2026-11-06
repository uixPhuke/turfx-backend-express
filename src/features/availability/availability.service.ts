import { quote } from "../pricing/quote";
import { Temporal } from "@js-temporal/polyfill";
import { PrismaClient } from "@prisma/client";
import { ReservationError } from "../reservations/reservation.service";
export class AvailabilityService {
  constructor(private db: PrismaClient) {}
  async list(resourceId: string, date: string, participants: number) {
    const resource = await this.db.resource.findUnique({
      where: { id: resourceId },
      include: {
        facility: { include: { venue: true } },
        operatingHour_resource: true,
        pricingRule_resource: {
          orderBy: [{ priority: "desc" }, { id: "asc" }],
        },
      },
    });
    if (
      !resource ||
      !resource.isActive ||
      !resource.facility.isActive ||
      !resource.facility.venue.isActive ||
      resource.facility.venue.status !== "APPROVED" ||
      resource.facility.venue.deletedAt
    )
      throw new ReservationError(404, "Resource unavailable");
    if (participants > resource.capacity)
      throw new ReservationError(400, "Participant capacity exceeded");
    let plain: Temporal.PlainDate;
    try {
      plain = Temporal.PlainDate.from(date);
    } catch {
      throw new ReservationError(400, "Invalid calendar date");
    }
    const zone = resource.facility.venue.timezone;
    const midnight = plain.toZonedDateTime(zone),
      tomorrow = midnight.add({ days: 1 });
    const from = new Date(midnight.epochMilliseconds),
      to = new Date(tomorrow.epochMilliseconds);
    const [reservations, exceptions, sessions] = await Promise.all([
      this.db.resourceReservation.findMany({
        where: {
          resourceId,
          isBlocking: true,
          startsAt: { lt: to },
          endsAt: { gt: from },
        },
      }),
      this.db.availabilityException.findMany({
        where: { resourceId, startsAt: { lt: to }, endsAt: { gt: from } },
      }),
      this.db.capacitySession.findMany({
        where: { resourceId, startsAt: { gte: from, lt: to } },
        orderBy: { startsAt: "asc" },
      }),
    ]);
    const candidates: { startsAt: Date; endsAt: Date; remaining: number }[] =
      [];
    if (resource.mode === "CAPACITY_BASED")
      for (const session of sessions)
        candidates.push({
          startsAt: session.startsAt,
          endsAt: session.endsAt,
          remaining: session.capacity - session.reserved,
        });
    else
      for (const hours of resource.operatingHour_resource.filter(
        (hour) => hour.weekday === plain.dayOfWeek % 7,
      )) {
        const open = plain.toZonedDateTime({
          timeZone: zone,
          plainTime: {
            hour: Math.floor(hours.opensMinute / 60),
            minute: hours.opensMinute % 60,
          },
        });
        const close =
          hours.closesMinute === 1440
            ? tomorrow
            : plain.toZonedDateTime({
                timeZone: zone,
                plainTime: {
                  hour: Math.floor(hours.closesMinute / 60),
                  minute: hours.closesMinute % 60,
                },
              });
        for (
          let slot = open;
          slot.add({ minutes: resource.slotMinutes }).epochMilliseconds <=
          close.epochMilliseconds;
          slot = slot.add({ minutes: resource.slotMinutes })
        ) {
          candidates.push({
            startsAt: new Date(slot.epochMilliseconds),
            endsAt: new Date(
              slot.add({ minutes: resource.slotMinutes }).epochMilliseconds,
            ),
            remaining: resource.capacity,
          });
        }
      }
    const slots = candidates.map((candidate) => {
      let amountMinor: number | null = null;
      try {
        amountMinor = quote({
          startsAt: candidate.startsAt,
          endsAt: candidate.endsAt,
          slotMinutes: resource.slotMinutes,
          timezone: zone,
          participants,
          mode: resource.mode,
          rules: resource.pricingRule_resource,
        }).totalMinor;
      } catch {
        /* Unpriced slots cannot be booked. */
      }
      const conflict = [
        ...exceptions,
        ...(resource.mode === "EXCLUSIVE" ? reservations : []),
      ].some(
        (item) =>
          item.startsAt < candidate.endsAt && item.endsAt > candidate.startsAt,
      );
      return {
        ...candidate,
        available:
          amountMinor !== null &&
          !conflict &&
          candidate.startsAt > new Date() &&
          candidate.remaining >= participants,
        amountMinor,
      };
    });
    return {
      resourceId,
      date,
      timezone: zone,
      currency: resource.currency,
      slots,
    };
  }
}
