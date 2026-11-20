import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ReservationError } from "../reservations/reservation.service";
export function customerRoutes(db: PrismaClient, authenticate: RequestHandler) {
  const router = Router(),
    id = z.string().uuid();
  router.get("/account/roles", authenticate, async (_req, res) =>
    res.json({
      success: true,
      data: (
        await db.userRole.findMany({
          where: { userId: res.locals.identity.user.id },
          select: { role: true },
        })
      ).map((row) => row.role),
    }),
  );
  router.patch("/account", authenticate, async (req, res) => {
    const input = z
      .strictObject({
        name: z.string().trim().min(2).max(100),
        phone: z
          .string()
          .regex(/^\+[1-9]\d{7,14}$/)
          .nullable()
          .optional(),
      })
      .parse(req.body);
    const user = await db.user.update({
      where: { id: res.locals.identity.user.id },
      data: input,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        isVerified: true,
      },
    });
    res.json({ success: true, data: user });
  });
  router.get("/favourites", authenticate, async (_req, res) => {
    res.json({
      success: true,
      data: await db.favourite.findMany({
        where: {
          userId: res.locals.identity.user.id,
          venue: { status: "APPROVED", isActive: true, deletedAt: null },
        },
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              description: true,
              address: true,
              latitude: true,
              longitude: true,
              timezone: true,
              venueMedia_venue: {
                orderBy: [{ position: "asc" }, { id: "asc" }],
                take: 1,
                select: { url: true },
              },
              facility_venue: {
                where: { isActive: true },
                select: {
                  resource_facility: {
                    where: { isActive: true },
                    select: {
                      currency: true,
                      slotMinutes: true,
                      resourceSport_resource: {
                        select: { sport: { select: { name: true } } },
                      },
                      pricingRule_resource: {
                        select: { amountMinor: true, configuration: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    });
  });
  router.put("/favourites/:id", authenticate, async (req, res) => {
    const venueId = id.parse(req.params.id),
      userId = res.locals.identity.user.id;
    if (
      !(await db.venue.findFirst({
        where: {
          id: venueId,
          status: "APPROVED",
          isActive: true,
          deletedAt: null,
        },
      }))
    )
      throw new ReservationError(404, "Venue unavailable");
    res.json({
      success: true,
      data: await db.favourite.upsert({
        where: { userId_venueId: { userId, venueId } },
        create: { userId, venueId },
        update: {},
      }),
    });
  });
  router.delete("/favourites/:id", authenticate, async (req, res) => {
    await db.favourite.deleteMany({
      where: {
        userId: res.locals.identity.user.id,
        venueId: id.parse(req.params.id),
      },
    });
    res.status(204).end();
  });
  router.get("/notifications", authenticate, async (_req, res) => {
    const rows = await db.notification.findMany({
      where: { receiverId: res.locals.identity.user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
    });
    const bookingIds = rows.flatMap((row) => {
      const data = row.data as Record<string, unknown> | null;
      return typeof data?.bookingId === "string" &&
        z.uuid().safeParse(data.bookingId).success
        ? [data.bookingId]
        : [];
    });
    const bookings = bookingIds.length
      ? await db.booking.findMany({
          where: {
            id: { in: bookingIds },
            customerId: res.locals.identity.user.id,
          },
          select: {
            id: true,
            reference: true,
            startsAt: true,
            endsAt: true,
            status: true,
            totalMinor: true,
            currency: true,
            resource: {
              select: {
                name: true,
                facility: {
                  select: { venue: { select: { name: true, timezone: true } } },
                },
              },
            },
          },
        })
      : [];
    res.json({
      success: true,
      data: rows.map((row) => {
        const data = row.data as Record<string, unknown> | null;
        return {
          id: row.id,
          title: row.title,
          body: row.body,
          kind: row.kind,
          createdAt: row.createdAt,
          readAt: row.readAt,
          booking: bookings.find((b) => b.id === data?.bookingId) || null,
        };
      }),
    });
  });
  router.post("/notifications/:id/read", authenticate, async (req, res) => {
    const changed = await db.notification.updateMany({
      where: {
        id: id.parse(req.params.id),
        receiverId: res.locals.identity.user.id,
      },
      data: { readAt: new Date() },
    });
    if (!changed.count)
      throw new ReservationError(404, "Notification not found");
    res.status(204).end();
  });
  return router;
}
