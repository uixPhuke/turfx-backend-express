import { Server as HttpServer } from "node:http";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AuthService, AuthOptions } from "../identity/auth.service";
import { CommunityService } from "./community.service";

export function attachRealtime(
  server: HttpServer,
  db: PrismaClient,
  options: AuthOptions,
  allowedOrigins: string[],
  adapter?: ReturnType<typeof createAdapter>,
) {
  const io = new Server(server, {
    cors: { origin: allowedOrigins },
    maxHttpBufferSize: 16384,
  });
  if (adapter) io.adapter(adapter);
  const auth = new AuthService(db, options),
    community = new CommunityService(db);
  io.use(async (socket, next) => {
    try {
      const token = z.string().max(4096).parse(socket.handshake.auth.token);
      const identity = await auth.authenticate(token);
      socket.data.token = token;
      socket.data.userId = identity.user.id;
      next();
    } catch {
      next(new Error("Authentication required"));
    }
  });
  const broadcast = async (conversationId: string, message: unknown) => {
    const sockets = await io
      .in(`conversation:${conversationId}`)
      .fetchSockets();
    await Promise.all(
      sockets.map(async (socket) => {
        try {
          const identity = await auth.authenticate(socket.data.token);
          await community.member(identity.user.id, conversationId);
          socket.emit("message:new", message);
        } catch {
          socket.leave(`conversation:${conversationId}`);
          socket.disconnect(true);
        }
      }),
    );
  };
  io.on("connection", (socket) => {
    let count = 0,
      windowStart = Date.now();
    socket.use((_packet, next) => {
      if (Date.now() - windowStart > 60000) {
        count = 0;
        windowStart = Date.now();
      }
      if (++count > 120) return next(new Error("Too many events"));
      next();
    });
    socket.on("conversation:join", async (input, ack: unknown) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const conversationId = z.string().uuid().parse(input);
        const identity = await auth.authenticate(socket.data.token);
        await community.member(identity.user.id, conversationId);
        await socket.join(`conversation:${conversationId}`);
        reply({ ok: true });
      } catch {
        reply({ ok: false, message: "Conversation access denied" });
      }
    });
    socket.on("message:send", async (input, ack: unknown) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const data = z
          .strictObject({
            conversationId: z.string().uuid(),
            body: z.string().trim().min(1).max(4000),
            clientMessageId: z.string().uuid(),
          })
          .parse(input);
        const identity = await auth.authenticate(socket.data.token);
        const message = await community.message(
          identity.user.id,
          data.conversationId,
          data.body,
          data.clientMessageId,
        );
        reply({ ok: true, data: message });
        await broadcast(data.conversationId, message);
      } catch {
        reply({ ok: false, message: "Message could not be sent" });
      }
    });
    socket.on("typing", async (input) => {
      try {
        const conversationId = z.string().uuid().parse(input);
        const identity = await auth.authenticate(socket.data.token);
        await community.member(identity.user.id, conversationId);
        // Only identifiers are broadcast; typing never includes message contents.
        socket
          .to(`conversation:${conversationId}`)
          .emit("typing", { userId: identity.user.id, conversationId });
      } catch {}
    });
  });
  return { broadcast, close: () => io.close() };
}
