import { CommunityLifecycle } from "./lifecycle.service";
import { PrismaClient, Prisma } from "@prisma/client";
import { ReservationError } from "../reservations/reservation.service";
export class CommunityService {
  constructor(private db: PrismaClient) {}
  async member(actor: string, conversationId: string) {
    const member = await this.db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: actor } },
    });
    if (!member || member.leftAt)
      throw new ReservationError(403, "Conversation membership required");
    return member;
  }
  async team(actor: string, name: string, description?: string) {
    return this.db.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: { name, description, creatorId: actor },
      });
      await tx.teamMember.create({
        data: { teamId: team.id, userId: actor, role: "ADMIN" },
      });
      const conversation = await tx.conversation.create({
        data: { kind: "TEAM", name, teamId: team.id },
      });
      await tx.conversationMember.create({
        data: { conversationId: conversation.id, userId: actor, role: "ADMIN" },
      });
      return { ...team, conversationId: conversation.id };
    });
  }
  async conversation(actor: string, name: string, recipientIds: string[]) {
    const ids = [...new Set([actor, ...recipientIds])];
    if (
      (await this.db.user.count({
        where: {
          id: { in: ids },
          isBlocked: false,
          deletedAt: null,
          isVerified: true,
        },
      })) !== ids.length
    )
      throw new ReservationError(400, "A participant is unavailable");
    if (
      await this.db.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: actor, blockedId: { in: recipientIds } },
            { blockedId: actor, blockerId: { in: recipientIds } },
          ],
        },
      })
    )
      throw new ReservationError(
        403,
        "A participant cannot receive messages from this account",
      );
    return this.db.$transaction(async (tx) => {
      const row = await tx.conversation.create({
        data: { kind: ids.length === 2 ? "DIRECT" : "GROUP", name },
      });
      await tx.conversationMember.createMany({
        data: ids.map((userId) => ({
          userId,
          conversationId: row.id,
          role: userId === actor ? "ADMIN" : "MEMBER",
        })),
      });
      return row;
    });
  }
  async message(
    actor: string,
    conversationId: string,
    body: string,
    clientMessageId: string,
  ) {
    return this.db.$transaction(async (tx) => {
      // Membership is checked for every send, including retries and socket requests.
      const member = await tx.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId: actor } },
      });
      if (!member || member.leftAt)
        throw new ReservationError(403, "Conversation membership required");
      const room = await tx.conversation.findUniqueOrThrow({
        where: { id: conversationId },
        include: {
          conversationMember_conversation: { where: { leftAt: null } },
        },
      });
      if (room.kind === "DIRECT") {
        const peers = room.conversationMember_conversation
          .map((m) => m.userId)
          .filter((id) => id !== actor);
        if (
          await tx.userBlock.findFirst({
            where: {
              OR: [
                { blockerId: actor, blockedId: { in: peers } },
                { blockedId: actor, blockerId: { in: peers } },
              ],
            },
          })
        )
          throw new ReservationError(
            403,
            "Direct messaging is blocked for this conversation",
          );
      }
      const existing = await tx.message.findUnique({
        where: {
          senderId_clientMessageId: { senderId: actor, clientMessageId },
        },
      });
      if (existing) {
        if (
          existing.conversationId !== conversationId ||
          existing.body !== body
        )
          throw new ReservationError(409, "Message key was already used");
        return existing;
      }
      try {
        const message = await tx.message.create({
          data: { senderId: actor, conversationId, body, clientMessageId },
        });
        await tx.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
        return message;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        )
          throw new ReservationError(
            409,
            "Message is already being delivered; retry the same key",
          );
        throw error;
      }
    });
  }
  async game(
    actor: string,
    input: {
      title: string;
      sportId: string;
      startsAt: Date;
      endsAt: Date;
      participantLimit: number;
      visibility: string;
      locationDescription?: string;
      teamId?: string;
      bookingId?: string;
    },
  ) {
    if (input.startsAt <= new Date() || input.endsAt <= input.startsAt)
      throw new ReservationError(400, "Invalid game interval");
    return this.db.$transaction(async (tx) => {
      if (input.bookingId) {
        await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${input.bookingId}::uuid FOR UPDATE`;
        const booking = await tx.booking.findFirst({
          where: {
            id: input.bookingId,
            customerId: actor,
            status: "CONFIRMED",
          },
        });
        if (
          !booking ||
          input.startsAt < booking.startsAt ||
          input.endsAt > booking.endsAt ||
          (booking.priceSnapshot as Prisma.JsonObject).sportId !==
            input.sportId ||
          input.participantLimit > booking.participants
        )
          throw new ReservationError(
            409,
            "Game time, sport and capacity must match your confirmed booking",
          );
      }
      if (input.teamId) {
        await tx.$queryRaw`SELECT id FROM "Team" WHERE id=${input.teamId}::uuid FOR UPDATE`;
        if (
          !(await tx.teamMember.findUnique({
            where: { teamId_userId: { teamId: input.teamId, userId: actor } },
          }))
        )
          throw new ReservationError(403, "Team membership required");
      }
      if (input.visibility === "TEAM" && !input.teamId)
        throw new ReservationError(400, "Team games require a team");
      if (
        !(await tx.sport.findFirst({
          where: { id: input.sportId, isActive: true },
        }))
      )
        throw new ReservationError(400, "Sport unavailable");
      const game = await tx.game.create({
        data: { ...input, organizerId: actor },
      });
      await tx.gameParticipant.create({
        data: { gameId: game.id, userId: actor, status: "CONFIRMED" },
      });
      const conversation = await tx.conversation.create({
        data: { gameId: game.id, name: game.title, kind: "GAME" },
      });
      await tx.conversationMember.create({
        data: { conversationId: conversation.id, userId: actor, role: "ADMIN" },
      });
      return game;
    });
  }
  async requestJoin(actor: string, gameId: string) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Game" WHERE id=${gameId}::uuid FOR UPDATE`;
      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (!game || game.status !== "OPEN" || game.startsAt <= new Date())
        throw new ReservationError(404, "Game unavailable");
      if (game.visibility !== "PUBLIC")
        throw new ReservationError(403, "This game requires an invitation");
      const previous = await tx.gameParticipant.findUnique({
        where: { gameId_userId: { gameId, userId: actor } },
      });
      if (previous?.status === "CONFIRMED") return previous;
      return tx.gameParticipant.upsert({
        where: { gameId_userId: { gameId, userId: actor } },
        create: { gameId, userId: actor },
        update: { status: "REQUESTED" },
      });
    });
  }
  async acceptPlayer(actor: string, gameId: string, userId: string) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Game" WHERE id=${gameId}::uuid FOR UPDATE`;
      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (!game || game.organizerId !== actor)
        throw new ReservationError(
          403,
          "Only the organizer can accept players",
        );
      const participant = await tx.gameParticipant.findUnique({
        where: { gameId_userId: { gameId, userId } },
      });
      if (!participant)
        throw new ReservationError(404, "Participation request not found");
      if (participant.status === "CONFIRMED") return participant;
      if (
        game.status !== "OPEN" ||
        game.startsAt <= new Date() ||
        (await tx.gameParticipant.count({
          where: { gameId, status: "CONFIRMED" },
        })) >= game.participantLimit
      )
        throw new ReservationError(409, "Game is full or closed");
      const result = await tx.gameParticipant.update({
        where: { id: participant.id },
        data: { status: "CONFIRMED" },
      });
      const room = await tx.conversation.findFirst({ where: { gameId } });
      if (room)
        await tx.conversationMember.upsert({
          where: { conversationId_userId: { conversationId: room.id, userId } },
          create: { conversationId: room.id, userId },
          update: { leftAt: null },
        });
      return result;
    });
  }
  async invite(actor: string, teamId: string, recipientId: string) {
    const member = await this.db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: actor } },
    });
    if (member?.role !== "ADMIN")
      throw new ReservationError(403, "Team administrator required");
    if (
      !(await this.db.user.findFirst({
        where: { id: recipientId, deletedAt: null, isBlocked: false },
      }))
    )
      throw new ReservationError(404, "Player unavailable");
    return this.db.invitation.create({
      data: {
        senderId: actor,
        recipientId,
        teamId,
        kind: "TEAM",
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
  }
  async respond(actor: string, invitationId: string, accept: boolean) {
    const kind = await this.db.invitation.findFirst({
      where: { id: invitationId, recipientId: actor },
      select: { kind: true },
    });
    if (kind?.kind === "GAME")
      return new CommunityLifecycle(this.db).respondGame(
        actor,
        invitationId,
        accept,
      );
    return this.db.$transaction(async (tx) => {
      const invitation = await tx.invitation.findFirst({
        where: {
          id: invitationId,
          recipientId: actor,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      });
      if (!invitation)
        throw new ReservationError(404, "Invitation unavailable");
      if (invitation.kind === "TEAM" && invitation.teamId)
        await tx.$queryRaw`SELECT id FROM "Team" WHERE id=${invitation.teamId}::uuid FOR UPDATE`;
      const changed = await tx.invitation.updateMany({
        where: { id: invitationId, status: "PENDING" },
        data: { status: accept ? "ACCEPTED" : "DECLINED" },
      });
      if (changed.count !== 1)
        throw new ReservationError(409, "Invitation already answered");
      if (accept && invitation.kind === "TEAM" && invitation.teamId) {
        await tx.teamMember.upsert({
          where: {
            teamId_userId: { teamId: invitation.teamId, userId: actor },
          },
          create: { teamId: invitation.teamId, userId: actor },
          update: {},
        });
        const conversation = await tx.conversation.findFirst({
          where: { teamId: invitation.teamId },
        });
        if (conversation)
          await tx.conversationMember.upsert({
            where: {
              conversationId_userId: {
                conversationId: conversation.id,
                userId: actor,
              },
            },
            create: { conversationId: conversation.id, userId: actor },
            update: { leftAt: null },
          });
      }
      return { accepted: accept };
    });
  }
}
