import { PrismaClient } from "@prisma/client";
import { ReservationError } from "../reservations/reservation.service";
export class CommunityLifecycle {
  constructor(private db: PrismaClient) {}
  async teamMember(
    actor: string,
    teamId: string,
    userId: string,
    role: "ADMIN" | "MEMBER" | "REMOVE",
  ) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Team" WHERE id=${teamId}::uuid FOR UPDATE`;
      const caller = await tx.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: actor } },
      });
      if (
        !caller ||
        (caller.role !== "ADMIN" && !(actor === userId && role === "REMOVE"))
      )
        throw new ReservationError(403, "Team administrator required");
      const target = await tx.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
      });
      if (!target) throw new ReservationError(404, "Team member not found");
      if (
        target.role === "ADMIN" &&
        role !== "ADMIN" &&
        (await tx.teamMember.count({ where: { teamId, role: "ADMIN" } })) <= 1
      )
        throw new ReservationError(
          409,
          "Appoint another administrator before leaving",
        );
      const room = await tx.conversation.findFirst({ where: { teamId } });
      if (role === "REMOVE") {
        await tx.teamMember.delete({ where: { id: target.id } });
        if (room)
          await tx.conversationMember.updateMany({
            where: { conversationId: room.id, userId },
            data: { leftAt: new Date() },
          });
        await tx.gameParticipant.updateMany({
          where: {
            userId,
            game: { teamId, visibility: "TEAM", startsAt: { gt: new Date() } },
          },
          data: { status: "WITHDRAWN" },
        });
        await tx.conversationMember.updateMany({
          where: {
            userId,
            conversation: {
              game: {
                teamId,
                visibility: "TEAM",
                startsAt: { gt: new Date() },
              },
            },
          },
          data: { leftAt: new Date() },
        });
        await tx.game.updateMany({
          where: {
            teamId,
            visibility: "TEAM",
            organizerId: userId,
            startsAt: { gt: new Date() },
          },
          data: { status: "CANCELLED" },
        });
        await tx.invitation.updateMany({
          where: { teamId, recipientId: userId, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
      } else {
        await tx.teamMember.update({
          where: { id: target.id },
          data: { role },
        });
        if (room)
          await tx.conversationMember.updateMany({
            where: { conversationId: room.id, userId },
            data: { role },
          });
      }
      return { updated: true };
    });
  }
  async gameAccess(actor: string, gameId: string) {
    const game = await this.db.game.findUnique({
      where: { id: gameId },
      include: {
        sport: { select: { id: true, name: true } },
        gameParticipant_game: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!game) throw new ReservationError(404, "Game not found");
    const teamMember =
      game.visibility === "TEAM" &&
      game.teamId &&
      (await this.db.teamMember.findUnique({
        where: { teamId_userId: { teamId: game.teamId, userId: actor } },
      }));
    if (
      game.visibility !== "PUBLIC" &&
      game.organizerId !== actor &&
      !teamMember &&
      !game.gameParticipant_game.some((p) => p.userId === actor)
    )
      throw new ReservationError(404, "Game not found");
    // Requests are private to the organizer and the requesting player.
    return {
      ...game,
      gameParticipant_game: game.gameParticipant_game.filter(
        (p) =>
          p.status === "CONFIRMED" ||
          p.userId === actor ||
          game.organizerId === actor,
      ),
    };
  }
  async cancelGame(actor: string, gameId: string) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Game" WHERE id=${gameId}::uuid FOR UPDATE`;
      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (!game || game.organizerId !== actor)
        throw new ReservationError(
          403,
          "Only the organizer can cancel this game",
        );
      if (game.status === "CANCELLED") return game;
      if (game.startsAt <= new Date())
        throw new ReservationError(409, "This game has already started");
      const result = await tx.game.update({
        where: { id: gameId },
        data: { status: "CANCELLED" },
      });
      await tx.invitation.updateMany({
        where: { gameId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      const members = await tx.gameParticipant.findMany({
        where: { gameId, status: "CONFIRMED" },
      });
      await tx.notification.createMany({
        data: members.map((member) => ({
          receiverId: member.userId,
          kind: "game.cancelled",
          title: "Game cancelled",
          body: game.title,
          data: { gameId },
        })),
      });
      return result;
    });
  }
  async leaveGame(actor: string, gameId: string) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Game" WHERE id=${gameId}::uuid FOR UPDATE`;
      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (!game || game.startsAt <= new Date() || game.status !== "OPEN")
        throw new ReservationError(409, "Game unavailable");
      if (game.organizerId === actor)
        throw new ReservationError(
          409,
          "The organizer must cancel the game instead",
        );
      await tx.gameParticipant.updateMany({
        where: { gameId, userId: actor },
        data: { status: "WITHDRAWN" },
      });
      const room = await tx.conversation.findFirst({ where: { gameId } });
      if (room)
        await tx.conversationMember.updateMany({
          where: { conversationId: room.id, userId: actor },
          data: { leftAt: new Date() },
        });
      return { left: true };
    });
  }
  async inviteGame(actor: string, gameId: string, recipientId: string) {
    const game = await this.db.game.findUnique({ where: { id: gameId } });
    if (
      !game ||
      game.organizerId !== actor ||
      game.status !== "OPEN" ||
      game.startsAt <= new Date()
    )
      throw new ReservationError(
        403,
        "Only the organizer of an open game can invite players",
      );
    if (
      !(await this.db.user.findFirst({
        where: {
          id: recipientId,
          isVerified: true,
          isBlocked: false,
          deletedAt: null,
        },
      }))
    )
      throw new ReservationError(400, "Player unavailable");
    if (
      game.visibility === "TEAM" &&
      game.teamId &&
      !(await this.db.teamMember.findUnique({
        where: { teamId_userId: { teamId: game.teamId, userId: recipientId } },
      }))
    )
      throw new ReservationError(
        403,
        "Team-only games require current team membership",
      );
    return this.db.invitation.create({
      data: {
        kind: "GAME",
        senderId: actor,
        recipientId,
        gameId,
        expiresAt: game.startsAt,
      },
    });
  }
  async respondGame(actor: string, invitationId: string, accept: boolean) {
    return this.db.$transaction(async (tx) => {
      const invitation = await tx.invitation.findFirst({
        where: {
          id: invitationId,
          recipientId: actor,
          kind: "GAME",
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      });
      if (!invitation?.gameId)
        throw new ReservationError(404, "Invitation unavailable");
      await tx.$queryRaw`SELECT id FROM "Game" WHERE id=${invitation.gameId}::uuid FOR UPDATE`;
      const game = await tx.game.findUniqueOrThrow({
        where: { id: invitation.gameId },
      });
      if (
        accept &&
        game.visibility === "TEAM" &&
        game.teamId &&
        !(await tx.teamMember.findUnique({
          where: { teamId_userId: { teamId: game.teamId, userId: actor } },
        }))
      )
        throw new ReservationError(403, "Team membership required");
      const participant = await tx.gameParticipant.findUnique({
        where: { gameId_userId: { gameId: game.id, userId: actor } },
      });
      if (
        accept &&
        (game.status !== "OPEN" ||
          game.startsAt <= new Date() ||
          (participant?.status !== "CONFIRMED" &&
            (await tx.gameParticipant.count({
              where: { gameId: game.id, status: "CONFIRMED" },
            })) >= game.participantLimit))
      )
        throw new ReservationError(409, "Game is full or unavailable");
      const changed = await tx.invitation.updateMany({
        where: { id: invitationId, status: "PENDING" },
        data: { status: accept ? "ACCEPTED" : "DECLINED" },
      });
      if (!changed.count)
        throw new ReservationError(409, "Invitation already answered");
      if (accept) {
        await tx.gameParticipant.upsert({
          where: { gameId_userId: { gameId: game.id, userId: actor } },
          create: { gameId: game.id, userId: actor, status: "CONFIRMED" },
          update: { status: "CONFIRMED" },
        });
        const room = await tx.conversation.findFirst({
          where: { gameId: game.id },
        });
        if (room)
          await tx.conversationMember.upsert({
            where: {
              conversationId_userId: { conversationId: room.id, userId: actor },
            },
            create: { conversationId: room.id, userId: actor },
            update: { leftAt: null },
          });
      }
      return { accepted: accept };
    });
  }
}
