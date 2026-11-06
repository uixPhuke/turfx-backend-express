import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ReservationError } from "../reservations/reservation.service";
export class TicketService {
  constructor(
    private db: PrismaClient,
    private secret: string,
    private clock = () => new Date(),
  ) {}
  async issue(actor: string, id: string) {
    const booking = await this.db.booking.findFirst({
      where: { id, customerId: actor, status: "CONFIRMED" },
    });
    if (!booking)
      throw new ReservationError(404, "Confirmed booking unavailable");
    const now = this.clock(),
      remaining = Math.floor(
        (booking.endsAt.getTime() + 2 * 3600000 - now.getTime()) / 1000,
      );
    if (remaining <= 0)
      throw new ReservationError(409, "This booking ticket has expired");
    const token = jwt.sign(
      {
        bookingId: id,
        customerId: actor,
        resourceId: booking.resourceId,
        purpose: "BOOKING_ENTRY",
        iat: Math.floor(now.getTime() / 1000),
      },
      this.secret,
      {
        algorithm: "HS256",
        issuer: "playza",
        audience: "playza-check-in",
        expiresIn: Math.min(86400, remaining),
      },
    );
    return {
      token,
      reference: booking.reference,
      expiresAt: new Date(
        now.getTime() + Math.min(86400, remaining) * 1000,
      ).toISOString(),
    };
  }
  async checkIn(actor: string, token: string) {
    let data: {
      bookingId: string;
      customerId: string;
      resourceId: string;
      purpose: "BOOKING_ENTRY";
    };
    try {
      data = z
        .object({
          bookingId: z.uuid(),
          customerId: z.uuid(),
          resourceId: z.uuid(),
          purpose: z.literal("BOOKING_ENTRY"),
        })
        .parse(
          jwt.verify(token, this.secret, {
            algorithms: ["HS256"],
            issuer: "playza",
            audience: "playza-check-in",
            clockTimestamp: Math.floor(this.clock().getTime() / 1000),
          }),
        );
    } catch {
      throw new ReservationError(400, "Invalid or expired booking ticket");
    }
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${data.bookingId}::uuid FOR UPDATE`;
      const booking = await tx.booking.findUnique({
        where: { id: data.bookingId },
        include: { resource: { include: { facility: true } } },
      });
      if (
        !booking ||
        booking.customerId !== data.customerId ||
        booking.resourceId !== data.resourceId
      )
        throw new ReservationError(404, "Booking unavailable");
      if (
        !(await tx.venueMember.findFirst({
          where: {
            venueId: booking.resource.facility.venueId,
            userId: actor,
            isActive: true,
          },
        }))
      )
        throw new ReservationError(403, "Venue staff access required");
      if (booking.status !== "CONFIRMED")
        throw new ReservationError(409, "Booking is not confirmed");
      const now = this.clock();
      if (
        now.getTime() < booking.startsAt.getTime() - 3600000 ||
        now > booking.endsAt
      )
        throw new ReservationError(
          409,
          "Check-in opens one hour before the booking and closes when it ends",
        );
      if (booking.checkedInAt)
        throw new ReservationError(409, "This booking has already checked in");
      const checked = await tx.booking.update({
        where: { id: booking.id },
        data: { checkedInAt: now },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor,
          action: "booking.check_in",
          entityType: "Booking",
          entityId: booking.id,
        },
      });
      return {
        reference: checked.reference,
        checkedInAt: checked.checkedInAt,
        participants: checked.participants,
      };
    });
  }
}
