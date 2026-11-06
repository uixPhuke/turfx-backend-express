import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ReservationError } from "../reservations/reservation.service";
import { PlatformService } from "../platform/platform.service";
import { CommunityService } from "../community/community.service";
import { CommunityLifecycle } from "../community/lifecycle.service";
export function safetyRoutes(db: PrismaClient, auth: RequestHandler) {
  const router = Router(),
    id = z.string().uuid(),
    platform = new PlatformService(db);
  router.get("/account/blocks", auth, async (_req, res) =>
    res.json({
      success: true,
      data: await db.userBlock.findMany({
        where: { blockerId: res.locals.identity.user.id },
        include: { blocked: { select: { id: true, name: true } } },
        take: 100,
      }),
    }),
  );
  router.put("/account/blocks/:id", auth, async (req, res) => {
    const blockerId = res.locals.identity.user.id,
      blockedId = id.parse(req.params.id);
    if (blockerId === blockedId)
      throw new ReservationError(400, "You cannot block your own account");
    if (
      !(await db.user.findUnique({
        where: { id: blockedId },
        select: { id: true },
      }))
    )
      throw new ReservationError(404, "Player not found");
    res.json({
      success: true,
      data: await db.userBlock.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        create: { blockerId, blockedId },
        update: {},
      }),
    });
  });
  router.delete("/account/blocks/:id", auth, async (req, res) => {
    await db.userBlock.deleteMany({
      where: {
        blockerId: res.locals.identity.user.id,
        blockedId: id.parse(req.params.id),
      },
    });
    res.status(204).end();
  });
  router.post("/reports", auth, async (req, res) => {
    const actor = res.locals.identity.user.id,
      input = z
        .strictObject({
          targetType: z.enum(["USER", "MESSAGE", "GAME", "VENUE"]),
          targetId: id,
          reason: z.enum([
            "HARASSMENT",
            "SPAM",
            "INAPPROPRIATE_CONTENT",
            "FRAUD",
            "OTHER",
          ]),
          details: z.string().trim().min(5).max(2000),
        })
        .parse(req.body);
    if (
      (await db.safetyReport.count({
        where: {
          reporterId: actor,
          createdAt: { gt: new Date(Date.now() - 86400000) },
        },
      })) >= 20
    )
      throw new ReservationError(429, "Daily report limit reached");
    if (input.targetType === "MESSAGE") {
      const message = await db.message.findUnique({
        where: { id: input.targetId },
      });
      if (!message) throw new ReservationError(404, "Message unavailable");
      await new CommunityService(db).member(actor, message.conversationId);
    } else if (input.targetType === "GAME")
      await new CommunityLifecycle(db).gameAccess(actor, input.targetId);
    else if (input.targetType === "VENUE") {
      if (
        !(await db.venue.findFirst({
          where: { id: input.targetId, status: "APPROVED", deletedAt: null },
        }))
      )
        throw new ReservationError(404, "Venue unavailable");
    } else if (
      !(await db.user.findUnique({
        where: { id: input.targetId },
        select: { id: true },
      }))
    )
      throw new ReservationError(404, "Player unavailable");
    res
      .status(201)
      .json({
        success: true,
        data: await db.safetyReport.create({
          data: { ...input, reporterId: actor },
          select: { id: true, status: true, createdAt: true },
        }),
      });
  });
  router.get("/admin/reports", auth, async (_req, res) => {
    await platform.admin(res.locals.identity.user.id);
    res.json({
      success: true,
      data: await db.safetyReport.findMany({
        where: { status: "OPEN" },
        include: { reporter: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
    });
  });
  router.post("/admin/reports/:id/resolve", auth, async (req, res) => {
    const actor = res.locals.identity.user.id;
    await platform.admin(actor);
    const input = z
      .strictObject({
        resolution: z.string().trim().min(5).max(2000),
        hideContent: z.boolean().default(false),
      })
      .parse(req.body);
    const reportId = id.parse(req.params.id);
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "SafetyReport" WHERE id=${reportId}::uuid FOR UPDATE`;
      const report = await tx.safetyReport.findUnique({
        where: { id: reportId },
      });
      if (!report || report.status !== "OPEN")
        throw new ReservationError(409, "Report is not open");
      if (input.hideContent) {
        if (report.targetType === "MESSAGE")
          await tx.message.update({
            where: { id: report.targetId },
            data: { deletedAt: new Date() },
          });
        else if (report.targetType === "VENUE")
          await tx.venue.update({
            where: { id: report.targetId },
            data: { status: "REJECTED" },
          });
        else if (report.targetType === "GAME")
          await tx.game.update({
            where: { id: report.targetId },
            data: { status: "CANCELLED" },
          });
        else
          throw new ReservationError(
            400,
            "Use account blocking to restrict a user",
          );
      }
      await tx.auditLog.create({
        data: {
          actorId: actor,
          action: "report.resolve",
          entityType: "SafetyReport",
          entityId: reportId,
          metadata: input,
        },
      });
      return tx.safetyReport.update({
        where: { id: reportId },
        data: { status: "RESOLVED", resolution: input.resolution },
      });
    });
    res.json({ success: true, data: result });
  });
  return router;
}
