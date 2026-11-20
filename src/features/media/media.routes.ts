import { Router, RequestHandler } from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { PlatformService } from "../platform/platform.service";
import { ReservationError } from "../reservations/reservation.service";
export interface MediaProvider {
  upload(
    buffer: Buffer,
    publicId: string,
  ): Promise<{ publicId: string; url: string }>;
  remove(publicId: string): Promise<void>;
}
export function imageType(buffer: Buffer) {
  if (
    buffer.length >= 3 &&
    buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
  )
    return "image/jpeg";
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}
export function mediaRoutes(
  db: PrismaClient,
  authenticate: RequestHandler,
  provider?: MediaProvider,
) {
  const router = Router(),
    platform = new PlatformService(db),
    id = z.string().uuid();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 0 },
  }).single("image");
  const configured: RequestHandler = (_req, _res, next) => {
    if (!provider)
      throw new ReservationError(503, "Image storage is not configured");
    next();
  };
  const verified: RequestHandler = (req, _res, next) => {
    if (!req.file || imageType(req.file.buffer) !== req.file.mimetype)
      throw new ReservationError(400, "Choose a valid JPEG, PNG or WebP image");
    next();
  };
  router.post(
    "/owner/venues/:id/media",
    authenticate,
    configured,
    async (req, res, next) => {
      await platform.manage(
        res.locals.identity.user.id,
        id.parse(req.params.id),
      );
      if (
        (await db.venueMedia.count({
          where: { venueId: id.parse(req.params.id) },
        })) >= 20
      )
        throw new ReservationError(
          409,
          "A venue can have up to 20 photos. Remove a photo before adding another.",
        );
      next();
    },
    upload,
    verified,
    async (req, res) => {
      const venueId = id.parse(req.params.id),
        key = `playza/venues/${venueId}/${randomUUID()}`;
      const image = await provider!.upload(req.file!.buffer, key);
      let row;
      try {
        row = await db.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Venue" WHERE id=${venueId}::uuid FOR UPDATE`;
          const photos = await tx.venueMedia.findMany({
            where: { venueId },
            select: { position: true },
          });
          if (photos.length >= 20)
            throw new ReservationError(
              409,
              "A venue can have up to 20 photos. Remove a photo before adding another.",
            );
          return tx.venueMedia.create({
            data: {
              venueId,
              publicId: image.publicId,
              url: image.url,
              position:
                photos.reduce(
                  (max, photo) => Math.max(max, photo.position),
                  -1,
                ) + 1,
            },
          });
        });
      } catch (error) {
        await provider!.remove(image.publicId).catch(() => {});
        throw error;
      }
      res.status(201).json({ success: true, data: row });
    },
  );
  router.patch(
    "/owner/venues/:id/media/order",
    authenticate,
    async (req, res) => {
      const venueId = id.parse(req.params.id);
      await platform.manage(res.locals.identity.user.id, venueId);
      const { mediaIds } = z
        .strictObject({ mediaIds: z.array(id).min(1).max(100) })
        .parse(req.body);
      if (new Set(mediaIds).size !== mediaIds.length)
        throw new ReservationError(400, "Each photo must appear exactly once");
      const photos = await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Venue" WHERE id=${venueId}::uuid FOR UPDATE`;
        const current = await tx.venueMedia.findMany({
          where: { venueId },
          select: { id: true },
        });
        if (
          current.length !== mediaIds.length ||
          current.some((photo) => !mediaIds.includes(photo.id))
        )
          throw new ReservationError(
            409,
            "The gallery changed. Refresh and try again.",
          );
        for (const [position, mediaId] of mediaIds.entries())
          await tx.venueMedia.update({
            where: { id: mediaId },
            data: { position },
          });
        return tx.venueMedia.findMany({
          where: { venueId },
          select: { id: true, url: true, position: true },
          orderBy: [{ position: "asc" }, { id: "asc" }],
        });
      });
      res.json({ success: true, data: photos });
    },
  );
  router.delete(
    "/owner/venues/:id/media/:mediaId",
    authenticate,
    configured,
    async (req, res) => {
      const venueId = id.parse(req.params.id);
      await platform.manage(res.locals.identity.user.id, venueId);
      const media = await db.venueMedia.findFirst({
        where: { id: id.parse(req.params.mediaId), venueId },
      });
      if (!media) throw new ReservationError(404, "Image not found");
      await provider!.remove(media.publicId);
      await db.venueMedia.delete({ where: { id: media.id } });
      res.status(204).end();
    },
  );
  router.post(
    "/account/avatar",
    authenticate,
    configured,
    upload,
    verified,
    async (req, res) => {
      const image = await provider!.upload(
        req.file!.buffer,
        `playza/avatars/${res.locals.identity.user.id}`,
      );
      const user = await db.user.update({
        where: { id: res.locals.identity.user.id },
        data: { avatarUrl: image.url },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          isVerified: true,
        },
      });
      res.json({ success: true, data: user });
    },
  );
  return router;
}
