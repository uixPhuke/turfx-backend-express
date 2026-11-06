import { Router, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { TicketService } from "./ticket.service";
export function ticketRoutes(
  db: PrismaClient,
  auth: RequestHandler,
  secret: string,
) {
  const router = Router(),
    service = new TicketService(db, secret);
  router.get("/bookings/:id/ticket", auth, async (req, res) =>
    res.json({
      success: true,
      data: await service.issue(
        res.locals.identity.user.id,
        z.uuid().parse(req.params.id),
      ),
    }),
  );
  router.post("/owner/check-in", auth, async (req, res) => {
    const input = z
      .strictObject({ token: z.string().min(20).max(4096) })
      .parse(req.body);
    res.json({
      success: true,
      data: await service.checkIn(res.locals.identity.user.id, input.token),
    });
  });
  return router;
}
