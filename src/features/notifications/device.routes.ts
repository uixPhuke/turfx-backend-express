import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ReservationError } from "../reservations/reservation.service";
export function deviceRoutes(db: PrismaClient, auth: RequestHandler) {
  const router = Router(),
    token = z
      .string()
      .max(200)
      .regex(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/);
  router.post("/devices", auth, async (req, res) => {
    const input = z
        .strictObject({ token, platform: z.enum(["ios", "android"]) })
        .parse(req.body),
      userId = res.locals.identity.user.id;
    const result = await db.$transaction(async (tx) => {
      const old = await tx.deviceToken.findUnique({
        where: { token: input.token },
      });
      if (old && old.userId !== userId && old.isActive)
        throw new ReservationError(
          409,
          "Sign out of the previous account on this device first",
        );
      return tx.deviceToken.upsert({
        where: { token: input.token },
        create: { ...input, userId },
        update: { userId, platform: input.platform, isActive: true },
      });
    });
    res.json({ success: true, data: { id: result.id } });
  });
  router.post("/devices/disable", auth, async (req, res) => {
    const input = z.strictObject({ token }).parse(req.body);
    await db.deviceToken.updateMany({
      where: { token: input.token, userId: res.locals.identity.user.id },
      data: { isActive: false },
    });
    res.status(204).end();
  });
  return router;
}
