import { Router, RequestHandler } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { PlatformService } from "./platform.service";
import { ReservationError } from "../reservations/reservation.service";
export function managementRoutes(db: PrismaClient, auth: RequestHandler) {
  const router = Router(),
    scope = new PlatformService(db),
    id = z.string().uuid();
  router.patch("/owner/venues/:id", auth, async (req, res) => {
    const venueId = id.parse(req.params.id);
    await scope.manage(res.locals.identity.user.id, venueId);
    const input = z
      .strictObject({
        name: z.string().trim().min(2).max(120).optional(),
        description: z.string().trim().min(10).max(4000).optional(),
        address: z.record(z.string(), z.string()).optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    res.json({
      success: true,
      data: await db.venue.update({ where: { id: venueId }, data: input }),
    });
  });
  router.patch("/owner/facilities/:id", auth, async (req, res) => {
    const facility = await db.facility.findUnique({
      where: { id: id.parse(req.params.id) },
    });
    if (!facility) throw new ReservationError(404, "Facility not found");
    await scope.manage(res.locals.identity.user.id, facility.venueId);
    const input = z
      .strictObject({
        name: z.string().trim().min(2).max(120).optional(),
        description: z.string().max(2000).optional(),
        amenities: z.record(z.string(), z.boolean()).optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    res.json({
      success: true,
      data: await db.facility.update({
        where: { id: facility.id },
        data: input,
      }),
    });
  });
  router.get("/owner/resources/:id", auth, async (req, res) => {
    const resource = await scope.resourceAccess(
      res.locals.identity.user.id,
      id.parse(req.params.id),
    );
    res.json({
      success: true,
      data: await db.resource.findUnique({
        where: { id: resource.id },
        include: {
          operatingHour_resource: true,
          pricingRule_resource: true,
          availabilityException_resource: true,
          capacitySession_resource: {
            where: { endsAt: { gt: new Date() } },
            take: 100,
          },
        },
      }),
    });
  });
  router.patch("/owner/resources/:id", auth, async (req, res) => {
    const resourceId = id.parse(req.params.id);
    await scope.resourceAccess(res.locals.identity.user.id, resourceId);
    const input = z
      .strictObject({
        name: z.string().trim().min(2).max(120).optional(),
        capacity: z.number().int().min(1).max(10000).optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    const resource = await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Resource" WHERE id=${resourceId}::uuid FOR UPDATE`;
        if (input.capacity !== undefined) {
          const [booking, session] = await Promise.all([
            tx.booking.findFirst({
              where: {
                resourceId,
                endsAt: { gt: new Date() },
                status: { in: ["HELD", "PAYMENT_PENDING", "CONFIRMED"] },
                participants: { gt: input.capacity },
              },
            }),
            tx.capacitySession.findFirst({
              where: {
                resourceId,
                endsAt: { gt: new Date() },
                capacity: { gt: input.capacity },
              },
            }),
          ]);
          if (booking || session)
            throw new ReservationError(
              409,
              "Capacity cannot be reduced below existing bookings or sessions",
            );
        }
        return tx.resource.update({ where: { id: resourceId }, data: input });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    res.json({ success: true, data: resource });
  });
  router.post("/owner/resources/:id/blocks", auth, async (req, res) => {
    const resource = await scope.resourceAccess(
      res.locals.identity.user.id,
      id.parse(req.params.id),
    );
    const input = z
      .strictObject({
        startsAt: z.iso
          .datetime({ offset: true })
          .transform((v) => new Date(v)),
        endsAt: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
        reason: z.string().trim().min(3).max(500),
      })
      .parse(req.body);
    if (input.startsAt <= new Date() || input.endsAt <= input.startsAt)
      throw new ReservationError(400, "Choose a future interval");
    const block = await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Resource" WHERE id=${resource.id}::uuid FOR UPDATE`;
        const existing = await tx.booking.findFirst({
          where: {
            resourceId: resource.id,
            status: { in: ["HELD", "PAYMENT_PENDING", "CONFIRMED"] },
            startsAt: { lt: input.endsAt },
            endsAt: { gt: input.startsAt },
          },
        });
        if (existing)
          throw new ReservationError(
            409,
            "The interval contains existing bookings",
          );
        const exception = await tx.availabilityException.create({
          data: { ...input, resourceId: resource.id },
        });
        if (resource.mode === "EXCLUSIVE")
          await tx.resourceReservation.create({
            data: {
              resourceId: resource.id,
              exceptionId: exception.id,
              startsAt: input.startsAt,
              endsAt: input.endsAt,
              reason: input.reason,
            },
          });
        return exception;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    res.status(201).json({ success: true, data: block });
  });
  router.patch("/owner/prices/:id", auth, async (req, res) => {
    const row = await db.pricingRule.findUnique({
      where: { id: id.parse(req.params.id) },
    });
    if (!row) throw new ReservationError(404, "Price not found");
    await scope.resourceAccess(res.locals.identity.user.id, row.resourceId);
    const input = z
      .strictObject({
        amountMinor: z.number().int().min(0).max(100000000),
        priority: z.number().int().min(0).max(100),
      })
      .parse(req.body);
    res.json({
      success: true,
      data: await db.pricingRule.update({ where: { id: row.id }, data: input }),
    });
  });
  router.get("/owner/analytics", auth, async (_req, res) => {
    const venueWhere: Prisma.VenueWhereInput = {
      venueMember_venue: {
        some: {
          userId: res.locals.identity.user.id,
          isActive: true,
          role: { in: ["OWNER", "MANAGER"] },
        },
      },
    };
    const bookings = await db.booking.groupBy({
      by: ["status", "currency"],
      where: { resource: { facility: { venue: venueWhere } } },
      _count: true,
      _sum: { totalMinor: true },
    });
    res.json({ success: true, data: bookings });
  });
  router.get("/admin/users", auth, async (req, res) => {
    await scope.admin(res.locals.identity.user.id);
    const page = z.coerce
      .number()
      .int()
      .min(1)
      .default(1)
      .parse(req.query.page);
    res.json({
      success: true,
      data: await db.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          isBlocked: true,
          isVerified: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        skip: (page - 1) * 50,
      }),
    });
  });
  router.post("/admin/users/:id/block", auth, async (req, res) => {
    const actor = res.locals.identity.user.id;
    await scope.admin(actor);
    const userId = id.parse(req.params.id),
      input = z
        .strictObject({
          blocked: z.boolean(),
          reason: z.string().trim().min(5).max(500),
        })
        .parse(req.body);
    if (
      actor === userId ||
      (await db.userRole.findFirst({
        where: { userId, role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      }))
    )
      throw new ReservationError(
        403,
        "Administrator accounts require operator review",
      );
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isBlocked: input.blocked, tokenVersion: { increment: 1 } },
      });
      if (input.blocked)
        await tx.userSession.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      await tx.auditLog.create({
        data: {
          actorId: actor,
          action: input.blocked ? "user.block" : "user.unblock",
          entityType: "User",
          entityId: userId,
          metadata: { reason: input.reason },
        },
      });
    });
    res.status(204).end();
  });
  router.patch("/admin/sports/:id", auth, async (req, res) => {
    await scope.admin(res.locals.identity.user.id);
    const input = z
      .strictObject({
        name: z.string().trim().min(2).max(100).optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    res.json({
      success: true,
      data: await db.sport.update({
        where: { id: id.parse(req.params.id) },
        data: input,
      }),
    });
  });
  router.get("/admin/coupons", auth, async (_req, res) => {
    await scope.admin(res.locals.identity.user.id);
    res.json({
      success: true,
      data: await db.coupon.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    });
  });
  router.post("/admin/coupons", auth, async (req, res) => {
    await scope.admin(res.locals.identity.user.id);
    const input = z
      .strictObject({
        code: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z0-9_-]{3,40}$/),
        kind: z.enum(["FIXED_MINOR", "PERCENT_BPS"]),
        value: z.number().int().positive().max(100000000),
        maxDiscountMinor: z.number().int().positive().optional(),
        minBookingMinor: z.number().int().min(0).default(0),
        usageLimit: z.number().int().positive().optional(),
        usagePerUser: z.number().int().positive().default(1),
        validFrom: z.iso
          .datetime({ offset: true })
          .transform((v) => new Date(v)),
        validUntil: z.iso
          .datetime({ offset: true })
          .transform((v) => new Date(v)),
        venueId: id.optional(),
      })
      .parse(req.body);
    if (
      input.validUntil <= input.validFrom ||
      (input.kind === "PERCENT_BPS" && input.value > 10000)
    )
      throw new ReservationError(400, "Invalid coupon validity or value");
    res
      .status(201)
      .json({ success: true, data: await db.coupon.create({ data: input }) });
  });
  router.patch("/admin/coupons/:id", auth, async (req, res) => {
    await scope.admin(res.locals.identity.user.id);
    const input = z.strictObject({ isActive: z.boolean() }).parse(req.body);
    res.json({
      success: true,
      data: await db.coupon.update({
        where: { id: id.parse(req.params.id) },
        data: input,
      }),
    });
  });
  return router;
}
