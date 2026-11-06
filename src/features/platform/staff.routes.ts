import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ReservationError } from "../reservations/reservation.service";
export function staffRoutes(db: PrismaClient, auth: RequestHandler) {
  const router = Router(),
    id = z.uuid();
  async function owner(userId: string, venueId: string) {
    if (
      !(await db.venueMember.findFirst({
        where: { venueId, userId, role: "OWNER", isActive: true },
      }))
    )
      throw new ReservationError(403, "Venue owner access required");
  }
  router.get("/owner/venues/:id/staff", auth, async (req, res) => {
    const venueId = id.parse(req.params.id);
    await owner(res.locals.identity.user.id, venueId);
    res.json({
      success: true,
      data: await db.venueMember.findMany({
        where: { venueId },
        select: {
          userId: true,
          role: true,
          isActive: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    });
  });
  router.post("/owner/venues/:id/staff", auth, async (req, res) => {
    const venueId = id.parse(req.params.id);
    await owner(res.locals.identity.user.id, venueId);
    const input = z
      .strictObject({
        email: z.string().trim().toLowerCase().email(),
        role: z.enum(["MANAGER", "STAFF"]),
      })
      .parse(req.body);
    const user = await db.user.findFirst({
      where: {
        email: input.email,
        isVerified: true,
        isBlocked: false,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!user)
      throw new ReservationError(
        400,
        "An active verified staff account is required",
      );
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.venueMember.findUnique({
        where: { venueId_userId: { venueId, userId: user.id } },
      });
      if (existing?.role === "OWNER")
        throw new ReservationError(
          409,
          "Owner permissions require operator review",
        );
      const member = await tx.venueMember.upsert({
        where: { venueId_userId: { venueId, userId: user.id } },
        create: { venueId, userId: user.id, role: input.role },
        update: { isActive: true, role: input.role },
      });
      await tx.auditLog.create({
        data: {
          actorId: res.locals.identity.user.id,
          action: "venue.staff_change",
          entityType: "Venue",
          entityId: venueId,
          metadata: { userId: user.id, role: input.role },
        },
      });
      return member;
    });
    res.json({ success: true, data: result });
  });
  router.post(
    "/owner/venues/:id/staff/:userId/remove",
    auth,
    async (req, res) => {
      const venueId = id.parse(req.params.id),
        userId = id.parse(req.params.userId);
      await owner(res.locals.identity.user.id, venueId);
      const result = await db.venueMember.updateMany({
        where: { venueId, userId, role: { not: "OWNER" } },
        data: { isActive: false },
      });
      if (!result.count)
        throw new ReservationError(
          409,
          "Staff member unavailable or is an owner",
        );
      res.status(204).end();
    },
  );
  return router;
}
