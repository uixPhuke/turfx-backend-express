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
            include: {
              venueMedia_venue: { orderBy: { position: "asc" }, take: 1 },
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
    res.json({
      success: true,
      data: await db.notification.findMany({
        where: { receiverId: res.locals.identity.user.id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 100,
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
