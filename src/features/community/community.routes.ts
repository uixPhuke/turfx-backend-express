import { CommunityLifecycle } from "./lifecycle.service";
import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ReservationError } from "../reservations/reservation.service";
import { CommunityService } from "./community.service";
const id = z.string().uuid(),
  text = z.string().trim().min(1).max(4000),
  date = z
    .string()
    .datetime({ offset: true })
    .transform((value) => new Date(value));
export function communityRoutes(
  db: PrismaClient,
  authenticate: RequestHandler,
  onMessage?: (conversationId: string, message: unknown) => void,
) {
  const router = Router(),
    service = new CommunityService(db);
  const lifecycle = new CommunityLifecycle(db);
  router.use(authenticate);
  router.get("/teams", async (_req, res) => {
    res.json({
      success: true,
      data: await db.team.findMany({
        where: {
          teamMember_team: { some: { userId: res.locals.identity.user.id } },
        },
        include: {
          teamMember_team: {
            select: {
              role: true,
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      }),
    });
  });
  router.post("/teams", async (req, res) => {
    const input = z
      .strictObject({
        name: z.string().trim().min(2).max(100),
        description: z.string().max(1000).optional(),
      })
      .parse(req.body);
    res.status(201).json({
      success: true,
      data: await service.team(
        res.locals.identity.user.id,
        input.name,
        input.description,
      ),
    });
  });
  router.post("/teams/:id/invites", async (req, res) => {
    const input = z
      .union([
        z.strictObject({ recipientId: id }),
        z.strictObject({
          recipientEmail: z.string().trim().toLowerCase().email(),
        }),
      ])
      .parse(req.body);
    const recipientId =
      "recipientId" in input
        ? input.recipientId
        : (
            await db.user.findFirst({
              where: {
                email: input.recipientEmail,
                isVerified: true,
                isBlocked: false,
                deletedAt: null,
              },
              select: { id: true },
            })
          )?.id;
    if (!recipientId)
      throw new ReservationError(
        400,
        "That player cannot receive an invitation",
      );
    res.status(201).json({
      success: true,
      data: await service.invite(
        res.locals.identity.user.id,
        id.parse(req.params.id),
        recipientId,
      ),
    });
  });
  router.get("/invitations", async (_req, res) => {
    res.json({
      success: true,
      data: await db.invitation.findMany({
        where: {
          recipientId: res.locals.identity.user.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        include: {
          sender: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          game:{select:{id:true,title:true}},
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    });
  });
  router.post("/invitations/:id/respond", async (req, res) => {
    const input = z.strictObject({ accept: z.boolean() }).parse(req.body);
    res.json({
      success: true,
      data: await service.respond(
        res.locals.identity.user.id,
        id.parse(req.params.id),
        input.accept,
      ),
    });
  });
  router.get("/games", async (_req, res) => {
    res.json({
      success: true,
      data: await db.game.findMany({
        where: {
          status: "OPEN",
          startsAt: { gt: new Date() },
          OR: [
            { visibility: "PUBLIC" },
            { organizerId: res.locals.identity.user.id },
            {
              gameParticipant_game: {
                some: { userId: res.locals.identity.user.id },
              },
            },
            {
              visibility: "TEAM",
              team: {
                teamMember_team: {
                  some: { userId: res.locals.identity.user.id },
                },
              },
            },
          ],
        },
        include: {
          sport: { select: { name: true, id: true } },
          _count: {
            select: {
              gameParticipant_game: { where: { status: "CONFIRMED" } },
            },
          },
        },
        orderBy: { startsAt: "asc" },
        take: 50,
      }),
    });
  });
  router.post("/games", async (req, res) => {
    const input = z
      .strictObject({
        title: z.string().trim().min(2).max(120),
        sportId: id,
        startsAt: date,
        endsAt: date,
        participantLimit: z.number().int().min(2).max(10000),
        visibility: z.enum(["PUBLIC", "PRIVATE", "TEAM"]),
        locationDescription: z.string().max(1000).optional(),
        teamId: id.optional(),
        bookingId: id.optional(),
      })
      .parse(req.body);
    res.status(201).json({
      success: true,
      data: await service.game(res.locals.identity.user.id, input),
    });
  });
  router.post("/games/:id/join", async (req, res) => {
    res.json({
      success: true,
      data: await service.requestJoin(
        res.locals.identity.user.id,
        id.parse(req.params.id),
      ),
    });
  });
  router.post("/games/:id/accept", async (req, res) => {
    const input = z.strictObject({ userId: id }).parse(req.body);
    res.json({
      success: true,
      data: await service.acceptPlayer(
        res.locals.identity.user.id,
        id.parse(req.params.id),
        input.userId,
      ),
    });
  });
  router.get("/conversations", async (_req, res) => {
    res.json({
      success: true,
      data: await db.conversation.findMany({
        where: {
          conversationMember_conversation: {
            some: { userId: res.locals.identity.user.id, leftAt: null },
          },
        },
        include: {
          message_conversation: { orderBy: { createdAt: "desc" }, take: 1 },
          conversationMember_conversation: {
            select: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
    });
  });
  router.post("/conversations", async (req, res) => {
    const input = z
      .strictObject({
        name: z.string().trim().min(1).max(100),
        recipientIds: z.array(id).min(1).max(49),
      })
      .parse(req.body);
    res.status(201).json({
      success: true,
      data: await service.conversation(
        res.locals.identity.user.id,
        input.name,
        input.recipientIds,
      ),
    });
  });
  router.get("/conversations/:id/messages", async (req, res) => {
    const conversationId = id.parse(req.params.id);
    await service.member(res.locals.identity.user.id, conversationId);
    const before = z
      .string()
      .datetime({ offset: true })
      .optional()
      .parse(req.query.before);
    const beforeId = z.string().uuid().optional().parse(req.query.beforeId);
    res.json({
      success: true,
      data: await db.message.findMany({
        where: {
          conversationId,
          deletedAt: null,
          ...(before
            ? beforeId
              ? {
                  OR: [
                    { createdAt: { lt: new Date(before) } },
                    { createdAt: new Date(before), id: { lt: beforeId } },
                  ],
                }
              : { createdAt: { lt: new Date(before) } }
            : {}),
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 50,
      }),
    });
  });
  router.post("/conversations/:id/messages", async (req, res) => {
    const conversationId = id.parse(req.params.id),
      input = z
        .strictObject({ body: text, clientMessageId: id })
        .parse(req.body);
    const message = await service.message(
      res.locals.identity.user.id,
      conversationId,
      input.body,
      input.clientMessageId,
    );
    onMessage?.(conversationId, message);
    res.status(201).json({ success: true, data: message });
  });
  router.post("/conversations/:id/read", async (req, res) => {
    const conversationId = id.parse(req.params.id);
    await service.member(res.locals.identity.user.id, conversationId);
    await db.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: res.locals.identity.user.id,
        },
      },
      data: { lastReadAt: new Date() },
    });
    res.status(204).end();
  });
  router.patch("/teams/:id/members/:userId", async (req, res) => {
    const input = z
      .strictObject({ role: z.enum(["ADMIN", "MEMBER", "REMOVE"]) })
      .parse(req.body);
    res.json({
      success: true,
      data: await lifecycle.teamMember(
        res.locals.identity.user.id,
        id.parse(req.params.id),
        id.parse(req.params.userId),
        input.role,
      ),
    });
  });
  router.get("/games/:id", async (req, res) =>
    res.json({
      success: true,
      data: await lifecycle.gameAccess(
        res.locals.identity.user.id,
        id.parse(req.params.id),
      ),
    }),
  );
  router.post("/games/:id/cancel", async (req, res) =>
    res.json({
      success: true,
      data: await lifecycle.cancelGame(
        res.locals.identity.user.id,
        id.parse(req.params.id),
      ),
    }),
  );
  router.post("/games/:id/leave", async (req, res) =>
    res.json({
      success: true,
      data: await lifecycle.leaveGame(
        res.locals.identity.user.id,
        id.parse(req.params.id),
      ),
    }),
  );
  router.post("/games/:id/invites", async (req, res) => {
    const input = z
      .strictObject({ email: z.string().trim().toLowerCase().email() })
      .parse(req.body);
    const recipient = await db.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (!recipient) throw new ReservationError(400, "Player unavailable");
    res
      .status(201)
      .json({
        success: true,
        data: await lifecycle.inviteGame(
          res.locals.identity.user.id,
          id.parse(req.params.id),
          recipient.id,
        ),
      });
  });
  return router;
}
