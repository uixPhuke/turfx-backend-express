import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { PlatformService } from "./platform.service";

const id = z.string().uuid();
const date = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));
const page = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export function platformRoutes(db: PrismaClient, authenticate: RequestHandler) {
  const router = Router(),
    service = new PlatformService(db);
  router.use(authenticate);
  router.post("/owner/applications", async (req, res) => {
    const input = z
      .strictObject({
        businessName: z.string().trim().min(2).max(120),
        taxIdentifier: z.string().max(100).optional(),
        documents: z
          .array(
            z.object({
              url: z.string().url().startsWith("https://"),
              kind: z.string().max(50),
            }),
          )
          .max(10)
          .default([]),
      })
      .parse(req.body);
    res.status(201).json({
      success: true,
      data: await service.apply(res.locals.identity.user.id, input),
    });
  });
  router.get("/owner/applications", async (_req, res) => {
    res.json({
      success: true,
      data: await db.ownerApplication.findMany({
        where: { applicantId: res.locals.identity.user.id },
        orderBy: { createdAt: "desc" },
      }),
    });
  });
  router.get("/owner/venues", async (_req, res) => {
    res.json({
      success: true,
      data: await db.venue.findMany({
        where: {
          venueMember_venue: {
            some: { userId: res.locals.identity.user.id, isActive: true },
          },
          deletedAt: null,
        },
        include: {
          venueMember_venue: {
            where: { userId: res.locals.identity.user.id, isActive: true },
            select: { role: true },
          },
          facility_venue: { include: { resource_facility: true } },
        },
      }),
    });
  });
  router.post("/owner/venues", async (req, res) => {
    const input = z
      .strictObject({
        name: z.string().trim().min(2).max(120),
        description: z.string().trim().min(10).max(4000),
        address: z.record(z.string(), z.string()),
        timezone: z.string().max(80),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .parse(req.body);
    res.status(201).json({
      success: true,
      data: await service.createVenue(res.locals.identity.user.id, input),
    });
  });
  router.post("/owner/facilities", async (req, res) => {
    const input = z
      .strictObject({
        venueId: id,
        name: z.string().min(2).max(120),
        description: z.string().max(2000).optional(),
        amenities: z.record(z.string(), z.boolean()).default({}),
      })
      .parse(req.body);
    res.status(201).json({
      success: true,
      data: await service.createFacility(res.locals.identity.user.id, input),
    });
  });
  router.post("/owner/resources", async (req, res) => {
    const input = z
      .strictObject({
        facilityId: id,
        name: z.string().min(2).max(120),
        mode: z.enum(["EXCLUSIVE", "CAPACITY_BASED"]),
        capacity: z.number().int().min(1).max(10000),
        slotMinutes: z.number().int().min(15).max(1440),
        currency: z
          .string()
          .regex(/^[A-Z]{3}$/)
          .default("INR"),
        sportIds: z.array(id).min(1).max(30),
      })
      .parse(req.body);
    res.status(201).json({
      success: true,
      data: await service.createResource(res.locals.identity.user.id, input),
    });
  });
  router.put("/owner/resources/:id/hours", async (req, res) => {
    const input = z
      .array(
        z.strictObject({
          weekday: z.number().int().min(0).max(6),
          opensMinute: z.number().int().min(0).max(1439),
          closesMinute: z.number().int().min(1).max(1440),
        }),
      )
      .max(28)
      .parse(req.body);
    res.json({
      success: true,
      data: await service.hours(
        res.locals.identity.user.id,
        id.parse(req.params.id),
        input,
      ),
    });
  });
  router.post("/owner/resources/:id/prices", async (req, res) => {
    const input = z
      .strictObject({
        amountMinor: z.number().int().min(0).max(100000000),
        priority: z.number().int().min(0).max(100).default(0),
        configuration: z
          .strictObject({
            weekdays: z.array(z.number().int().min(0).max(6)).optional(),
            fromMinute: z.number().int().min(0).max(1439).optional(),
            toMinute: z.number().int().min(1).max(1440).optional(),
          })
          .default({}),
      })
      .parse(req.body);
    res.status(201).json({
      success: true,
      data: await service.price(
        res.locals.identity.user.id,
        id.parse(req.params.id),
        input.amountMinor,
        input.priority,
        input.configuration,
      ),
    });
  });
  router.post("/owner/sessions", async (req, res) => {
    const input = z
      .strictObject({
        resourceId: id,
        startsAt: date,
        endsAt: date,
        capacity: z.number().int().min(1).max(10000),
      })
      .parse(req.body);
    res.status(201).json({
      success: true,
      data: await service.session(res.locals.identity.user.id, input),
    });
  });
  router.get("/owner/bookings", async (req, res) => {
    const input = page.parse(req.query);
    res.json({
      success: true,
      data: await db.booking.findMany({
        where: {
          resource: {
            facility: {
              venue: {
                venueMember_venue: {
                  some: {
                    userId: res.locals.identity.user.id,
                    isActive: true,
                    role: { in: ["OWNER", "MANAGER"] },
                  },
                },
              },
            },
          },
        },
        include: {
          customer: { select: { id: true, name: true } },
          resource: { select: { id: true, name: true } },
        },
        orderBy: { startsAt: "desc" },
        take: input.limit,
        skip: (input.page - 1) * input.limit,
      }),
    });
  });
  router.use("/admin", async (_req, res, next) => {
    await service.admin(res.locals.identity.user.id);
    next();
  });
  router.get("/admin/applications", async (req, res) => {
    const input = page.parse(req.query);
    res.json({
      success: true,
      data: await db.ownerApplication.findMany({
        where: { status: "PENDING" },
        include: {
          applicant: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
        take: input.limit,
        skip: (input.page - 1) * input.limit,
      }),
    });
  });
  router.post("/admin/applications/:id/review", async (req, res) => {
    const input = z
      .strictObject({
        approved: z.boolean(),
        notes: z.string().max(2000).default(""),
      })
      .parse(req.body);
    res.json({
      success: true,
      data: await service.reviewApplication(
        res.locals.identity.user.id,
        id.parse(req.params.id),
        input.approved,
        input.notes,
      ),
    });
  });
  router.get("/admin/venues", async (req, res) => {
    const input = page.parse(req.query);
    res.json({
      success: true,
      data: await db.venue.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: (input.page - 1) * input.limit,
      }),
    });
  });
  router.post("/admin/venues/:id/review", async (req, res) => {
    const input = z.strictObject({ approved: z.boolean() }).parse(req.body);
    res.json({
      success: true,
      data: await service.reviewVenue(
        res.locals.identity.user.id,
        id.parse(req.params.id),
        input.approved,
      ),
    });
  });
  router.post("/admin/sports", async (req, res) => {
    const input = z
      .strictObject({
        name: z.string().min(2).max(100),
        slug: z.string().regex(/^[a-z][a-z0-9-]{1,60}$/),
      })
      .parse(req.body);
    res
      .status(201)
      .json({ success: true, data: await db.sport.create({ data: input }) });
  });
  router.get("/admin/analytics", async (_req, res) => {
    const [users, venues, bookings, payments, refunds] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.venue.count({ where: { deletedAt: null } }),
      db.booking.count(),
      db.payment.groupBy({
        by: ["currency"],
        where: {
          status: { in: ["CAPTURED", "PARTIALLY_REFUNDED", "REFUNDED"] },
        },
        _sum: { amountMinor: true },
      }),
      db.refund.findMany({
        where: { status: "PROCESSED" },
        select: { amountMinor: true, payment: { select: { currency: true } } },
      }),
    ]);
    const revenue = payments.map((p) => {
      const capturedMinor = p._sum.amountMinor || 0,
        refundedMinor = refunds
          .filter((r) => r.payment.currency === p.currency)
          .reduce((sum, r) => sum + r.amountMinor, 0);
      return {
        currency: p.currency,
        capturedMinor,
        refundedMinor,
        netMinor: capturedMinor - refundedMinor,
      };
    });
    res.json({ success: true, data: { users, venues, bookings, revenue } });
  });
  return router;
}
