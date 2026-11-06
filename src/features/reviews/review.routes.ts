import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ReservationError } from "../reservations/reservation.service";
import { PlatformService } from "../platform/platform.service";
export function reviewRoutes(db: PrismaClient, auth: RequestHandler) {
  const router = Router(),
    id = z.uuid();
  router.get("/venues/:id/reviews", async (req, res) => {
    const venueId = id.parse(req.params.id);
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
    const [reviews, summary] = await Promise.all([
      db.review.findMany({
        where: { venueId, isVisible: true, deletedAt: null },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          author: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.review.aggregate({
        where: { venueId, isVisible: true, deletedAt: null },
        _avg: { rating: true },
        _count: true,
      }),
    ]);
    res.json({
      success: true,
      data: { reviews, rating: summary._avg.rating, count: summary._count },
    });
  });
  router.post("/bookings/:id/review", auth, async (req, res) => {
    const input = z
      .strictObject({
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().min(5).max(2000),
      })
      .parse(req.body);
    const booking = await db.booking.findFirst({
      where: {
        id: id.parse(req.params.id),
        customerId: res.locals.identity.user.id,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        endsAt: { lt: new Date() },
      },
      include: { resource: { include: { facility: true } } },
    });
    if (!booking)
      throw new ReservationError(
        409,
        "Review an attended booking after it ends",
      );
    res
      .status(201)
      .json({
        success: true,
        data: await db.review.create({
          data: {
            ...input,
            bookingId: booking.id,
            authorId: res.locals.identity.user.id,
            venueId: booking.resource.facility.venueId,
          },
          select: { id: true, rating: true, comment: true },
        }),
      });
  });
  router.delete("/reviews/:id", auth, async (req, res) => {
    const result = await db.review.updateMany({
      where: {
        id: id.parse(req.params.id),
        authorId: res.locals.identity.user.id,
        deletedAt: null,
      },
      data: { deletedAt: new Date(), isVisible: false },
    });
    if (!result.count) throw new ReservationError(404, "Review unavailable");
    res.status(204).end();
  });
  router.post("/admin/reviews/:id/moderate", auth, async (req, res) => {
    const actor = res.locals.identity.user.id;
    await new PlatformService(db).admin(actor);
    const input = z
        .strictObject({
          isVisible: z.boolean(),
          reason: z.string().trim().min(5).max(500),
        })
        .parse(req.body),
      reviewId = id.parse(req.params.id);
    await db.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { isVisible: input.isVisible },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor,
          action: "review.moderate",
          entityType: "Review",
          entityId: reviewId,
          metadata: input,
        },
      });
    });
    res.status(204).end();
  });
  return router;
}
