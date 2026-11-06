import { openApi } from "./openapi.generated";
import { staffRoutes } from "../features/platform/staff.routes";
import { reviewRoutes } from "../features/reviews/review.routes";
import { ticketRoutes } from "../features/tickets/ticket.routes";
import { createHmac } from "node:crypto";
import { deviceRoutes } from "../features/notifications/device.routes";
import { safetyRoutes } from "../features/safety/safety.routes";
import { BillingOptions } from "../features/pricing/billing";
import { managementRoutes } from "../features/platform/management.routes";
import { CancellationService } from "../features/reservations/cancellation.service";
import { mediaRoutes, MediaProvider } from "../features/media/media.routes";
import { customerRoutes } from "../features/customer/customer.routes";
import { AvailabilityService } from "../features/availability/availability.service";
import { PaymentOptions } from "../features/finance/payment.service";
import { paymentRoutes } from "../features/finance/payment.routes";
import { communityRoutes } from "../features/community/community.routes";
import { platformRoutes } from "../features/platform/platform.routes";
import express, { ErrorRequestHandler, RequestHandler } from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit, Store } from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { z, ZodError } from "zod";
import { AuthOptions, AuthService } from "../features/identity/auth.service";
import {
  ReservationError,
  ReservationService,
} from "../features/reservations/reservation.service";

const bookingContext = {
  resource: {
    select: {
      name: true,
      facility: {
        select: {
          name: true,
          venue: {
            select: {
              name: true,
              address: true,
              timezone: true,
              venueMedia_venue: {
                select: { url: true },
                take: 1,
                orderBy: { position: "asc" },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.BookingInclude;
const email = z.string().trim().toLowerCase().email().max(254);
const password = z
  .string()
  .min(12)
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must not exceed 72 UTF-8 bytes",
  );
const code = z.string().regex(/^\d{6}$/);
const id = z.string().uuid();
const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const registration = z.strictObject({
  email,
  password,
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/)
    .optional(),
});
const reservation = z.strictObject({
  resourceId: id,
  sportId: id,
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,40}$/)
    .optional(),
  startsAt: z
    .string()
    .datetime({ offset: true })
    .transform((value) => new Date(value)),
  endsAt: z
    .string()
    .datetime({ offset: true })
    .transform((value) => new Date(value)),
  participants: z.number().int().positive().max(10000),
});

export interface ApiOptions extends AuthOptions {
  isDraining?: () => boolean;
  checkReadiness?: () => Promise<void>;
  onRequest?: (data: Record<string, unknown>) => void;
  rateLimitStore?: (prefix: string) => Store;
  trustProxyHops?: number;
  ticketSecret?: string;
  billing?: BillingOptions;
  media?: MediaProvider;
  payments?: PaymentOptions;
  allowedOrigins?: string[];
  onMessage?: (conversationId: string, message: unknown) => void;
  onError?: (error: unknown, requestId: string) => void;
}

export function createPostgresApp(db: PrismaClient, options: ApiOptions) {
  const app = express();
  const auth = new AuthService(db, options);
  const reservations = new ReservationService(db, options.billing);
  app.disable("x-powered-by");
  if (options.trustProxyHops) app.set("trust proxy", options.trustProxyHops);
  app.use((req, res, next) => {
    res.locals.requestId = randomUUID();
    res.setHeader("X-Request-ID", res.locals.requestId);
    const started = Date.now();
    res.setHeader("Cache-Control", "no-store");
    res.on("finish", () =>
      options.onRequest?.({
        requestId: res.locals.requestId,
        method: req.method,
        route: req.route?.path || "unmatched",
        status: res.statusCode,
        durationMs: Date.now() - started,
      }),
    );
    next();
  });
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        callback(
          null,
          !origin || (options.allowedOrigins || []).includes(origin),
        );
      },
    }),
  );
  app.use(
    express.json({
      limit: "256kb",
      verify(req, _res, buffer) {
        (req as typeof req & { rawBody: Buffer }).rawBody = Buffer.from(buffer);
      },
    }),
  );
  app.use(
    rateLimit({
      skip: (req) =>
        ["/api/v2/health", "/api/v2/live", "/api/v2/ready"].includes(req.path),
      store: options.rateLimitStore?.("global"),
      windowMs: 15 * 60000,
      limit: 1000,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  const authLimit = rateLimit({
    store: options.rateLimitStore?.("auth"),
    windowMs: 15 * 60000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });
  const challengeLimit = rateLimit({
    store: options.rateLimitStore?.("challenge"),
    windowMs: 10 * 60000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });
  const authenticate: RequestHandler = async (req, res, next) => {
    const header = req.get("Authorization");
    if (!header?.startsWith("Bearer "))
      throw new ReservationError(401, "Authentication required");
    res.locals.identity = await auth.authenticate(header.slice(7));
    next();
  };
  const router = express.Router();
  const swaggerUi = require("swagger-ui-express") as {
    serve: RequestHandler[];
    setup: (schema: unknown) => RequestHandler;
  };
  router.get("/openapi.json", (_req, res) => res.json(openApi));
  router.use("/docs", swaggerUi.serve, swaggerUi.setup(openApi));
  router.get("/live", (_req, res) => res.json({ success: true }));
  const ready: RequestHandler = async (_req, res) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (options.isDraining?.()) throw new Error("Draining");
      await Promise.race([
        Promise.all([db.$queryRaw`SELECT 1`, options.checkReadiness?.()]),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("Dependency timeout")),
            2000,
          );
          timer.unref();
        }),
      ]);
      res.json({
        success: true,
        data: { service: "PLAYZA PostgreSQL API", status: "healthy" },
      });
    } catch {
      res.status(503).json({ success: false, message: "Service not ready" });
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
  router.get("/health", ready);
  router.get("/ready", ready);
  router.post("/auth/register", authLimit, async (req, res) => {
    res.status(201).json({
      success: true,
      data: await auth.register(registration.parse(req.body)),
    });
  });
  router.post("/auth/login", authLimit, async (req, res) => {
    const input = z
      .strictObject({
        email,
        password: z.string().min(1).max(1000),
        device: z.string().max(200).optional(),
      })
      .parse(req.body);
    res.json({
      success: true,
      data: await auth.login(input.email, input.password, input.device),
    });
  });
  router.post("/auth/refresh", authLimit, async (req, res) => {
    const input = z
      .strictObject({ refreshToken: z.string().min(1).max(4096) })
      .parse(req.body);
    res.json({ success: true, data: await auth.rotate(input.refreshToken) });
  });
  router.post("/auth/request-code", challengeLimit, async (req, res) => {
    const input = z
      .strictObject({
        email,
        purpose: z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]),
      })
      .parse(req.body);
    await auth.sendChallenge(input.email, input.purpose);
    res.status(202).json({
      success: true,
      message: "If the account is eligible, a code has been sent",
    });
  });
  router.post("/auth/verify-email", authLimit, async (req, res) => {
    const input = z.strictObject({ email, code }).parse(req.body);
    await auth.completeChallenge(input.email, input.code, "EMAIL_VERIFICATION");
    res.json({ success: true, message: "Email verified" });
  });
  router.post("/auth/reset-password", authLimit, async (req, res) => {
    const input = z.strictObject({ email, code, password }).parse(req.body);
    await auth.completeChallenge(
      input.email,
      input.code,
      "PASSWORD_RESET",
      input.password,
    );
    res.json({ success: true, message: "Password changed; sign in again" });
  });
  router.get("/auth/me", authenticate, (_req, res) => {
    res.json({ success: true, data: res.locals.identity.user });
  });
  router.post("/auth/logout", authenticate, async (_req, res) => {
    await db.deviceToken.updateMany({
      where: { userId: res.locals.identity.user.id, isActive: true },
      data: { isActive: false },
    });
    await auth.logout(res.locals.identity.sessionId);
    res.status(204).end();
  });
  router.get("/sports", async (_req, res) => {
    const sports = await db.sport.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, iconUrl: true },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: sports });
  });
  router.get("/venues", async (req, res) => {
    const input = pagination
      .extend({
        search: z.string().trim().max(100).optional(),
        sportId: id.optional(),
      })
      .parse(req.query);
    const where: Prisma.VenueWhereInput = {
      status: "APPROVED",
      isActive: true,
      deletedAt: null,
      ...(input.search
        ? { name: { contains: input.search, mode: "insensitive" } }
        : {}),
      ...(input.sportId
        ? {
            facility_venue: {
              some: {
                isActive: true,
                resource_facility: {
                  some: {
                    isActive: true,
                    resourceSport_resource: {
                      some: {
                        sportId: input.sportId,
                        sport: { isActive: true },
                      },
                    },
                  },
                },
              },
            },
          }
        : {}),
    };
    const [total, venues] = await db.$transaction([
      db.venue.count({ where }),
      db.venue.findMany({
        where,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          latitude: true,
          longitude: true,
          timezone: true,
          venueMedia_venue: {
            orderBy: { position: "asc" },
            take: 1,
            select: { url: true },
          },
        },
      }),
    ]);
    res.json({
      success: true,
      data: venues,
      pagination: { page: input.page, limit: input.limit, total },
    });
  });
  router.get("/venues/:id", async (req, res) => {
    const venue = await db.venue.findFirst({
      where: {
        id: id.parse(req.params.id),
        status: "APPROVED",
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        timezone: true,
        latitude: true,
        longitude: true,
        venueMedia_venue: {
          orderBy: { position: "asc" },
          select: { url: true, position: true },
        },
        facility_venue: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            amenities: true,
            resource_facility: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                mode: true,
                capacity: true,
                slotMinutes: true,
                currency: true,
                pricingRule_resource: { select: { amountMinor: true } },
                resourceSport_resource: {
                  select: {
                    sport: { select: { id: true, name: true, slug: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!venue) throw new ReservationError(404, "Venue unavailable");
    res.json({ success: true, data: venue });
  });
  router.get("/resources/:id/availability", async (req, res) => {
    const input = z
      .object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .refine((value) => Number.isFinite(Date.parse(value))),
        participants: z.coerce.number().int().min(1).max(10000).default(1),
      })
      .parse(req.query);
    res.json({
      success: true,
      data: await new AvailabilityService(db).list(
        id.parse(req.params.id),
        input.date,
        input.participants,
      ),
    });
  });
  router.post("/bookings", authenticate, async (req, res) => {
    const input = reservation.parse(req.body);
    const key = z.string().min(8).max(160).parse(req.get("Idempotency-Key"));
    const booking = await reservations.reserve({
      ...input,
      customerId: res.locals.identity.user.id,
      idempotencyKey: `${res.locals.identity.user.id}:${key}`,
    });
    res.status(201).json({ success: true, data: booking });
  });
  router.get("/bookings", authenticate, async (req, res) => {
    const input = pagination.parse(req.query);
    const bookings = await db.booking.findMany({
      include: bookingContext,
      where: { customerId: res.locals.identity.user.id },
      orderBy: [{ startsAt: "desc" }, { id: "asc" }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    });
    res.json({ success: true, data: bookings });
  });
  router.get("/bookings/:id/cancellation", authenticate, async (req, res) => {
    res.json({
      success: true,
      data: await new CancellationService(db).preview(
        res.locals.identity.user.id,
        id.parse(req.params.id),
      ),
    });
  });
  router.post("/bookings/:id/cancel", authenticate, async (req, res) => {
    const input = z
      .strictObject({
        reason: z
          .string()
          .trim()
          .min(3)
          .max(500)
          .default("Customer cancellation"),
      })
      .parse(req.body || {});
    res.json({
      success: true,
      data: await new CancellationService(db).cancel(
        res.locals.identity.user.id,
        id.parse(req.params.id),
        input.reason,
      ),
    });
  });
  router.get("/bookings/:id", authenticate, async (req, res) => {
    const booking = await db.booking.findFirst({
      include: bookingContext,
      where: {
        id: id.parse(req.params.id),
        customerId: res.locals.identity.user.id,
      },
    });
    if (!booking) throw new ReservationError(404, "Booking not found");
    res.json({ success: true, data: booking });
  });
  router.use(
    ticketRoutes(
      db,
      authenticate,
      options.ticketSecret ||
        createHmac("sha256", options.accessSecret)
          .update("playza-booking-entry")
          .digest("hex"),
    ),
  );
  router.use(reviewRoutes(db, authenticate));
  router.use(paymentRoutes(db, authenticate, options.payments || {}));
  router.use(mediaRoutes(db, authenticate, options.media));
  router.use(customerRoutes(db, authenticate));
  router.use(staffRoutes(db, authenticate));
  router.use(managementRoutes(db, authenticate));
  router.use(deviceRoutes(db, authenticate));
  router.use(safetyRoutes(db, authenticate));
  router.use(communityRoutes(db, authenticate, options.onMessage));
  router.use(platformRoutes(db, authenticate));
  app.use("/api/v2", router);
  app.use((_req, _res, next) =>
    next(new ReservationError(404, "Route not found")),
  );
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        issues: error.issues.map(({ path, message }) => ({ path, message })),
      });
      return;
    }
    if (error instanceof ReservationError) {
      res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
      return;
    }
    if (
      error?.code === "LIMIT_FILE_SIZE" ||
      error?.code === "LIMIT_UNEXPECTED_FILE" ||
      error?.code === "LIMIT_FIELD_COUNT"
    ) {
      res
        .status(400)
        .json({ success: false, message: "Upload one image, up to 8 MB" });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const status =
        error.code === "P2025"
          ? 404
          : ["P2002", "P2003", "P2004", "P2034"].includes(error.code)
            ? 409
            : 500;
      if (status !== 500) {
        res.status(status).json({
          success: false,
          message:
            status === 404
              ? "Record not found"
              : "The change conflicts with existing records; refresh and retry",
        });
        return;
      }
    }
    if (error?.type === "entity.parse.failed") {
      res.status(400).json({ success: false, message: "Invalid JSON" });
      return;
    }
    if (error?.type === "entity.too.large") {
      res.status(413).json({ success: false, message: "Request too large" });
      return;
    }
    options.onError?.(error, res.locals.requestId);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      requestId: res.locals.requestId,
    });
  };
  app.use((_req, res) => res.status(404).json({ success: false, message: "Endpoint not found", requestId: res.locals.requestId }));
  app.use(errors);
  return app;
}
