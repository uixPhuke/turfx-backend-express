import { Prisma, PrismaClient } from "@prisma/client";
export async function nearbyVenues(
  db: PrismaClient,
  input: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    page: number;
    limit: number;
    search?: string;
    sportId?: string;
  },
) {
  const base = Prisma.sql`SELECT v.id, 6371 * acos(least(1.0, greatest(-1.0,
    sin(radians(${input.latitude}::float8))*sin(radians(v.latitude::float8)) +
    cos(radians(${input.latitude}::float8))*cos(radians(v.latitude::float8))*cos(radians(v.longitude::float8-${input.longitude}::float8))))) AS distance
    FROM "Venue" v WHERE v.status='APPROVED' AND v."isActive"=true AND v."deletedAt" IS NULL
    ${input.search ? Prisma.sql`AND position(lower(${input.search}) in lower(v.name))>0` : Prisma.empty}
    ${input.sportId ? Prisma.sql`AND EXISTS (SELECT 1 FROM "Facility" f JOIN "Resource" r ON r."facilityId"=f.id JOIN "ResourceSport" rs ON rs."resourceId"=r.id JOIN "Sport" s ON s.id=rs."sportId" WHERE f."venueId"=v.id AND f."isActive"=true AND r."isActive"=true AND s."isActive"=true AND s.id=${input.sportId}::uuid)` : Prisma.empty}`;
  const [count, rows] = await db.$transaction([
    db.$queryRaw<{ total: bigint }[]>(
      Prisma.sql`SELECT count(*) AS total FROM (${base}) nearby WHERE distance<=${input.radiusKm}`,
    ),
    db.$queryRaw<{ id: string; distance: number }[]>(
      Prisma.sql`SELECT * FROM (${base}) nearby WHERE distance<=${input.radiusKm} ORDER BY distance,id LIMIT ${input.limit} OFFSET ${(input.page - 1) * input.limit}`,
    ),
  ]);
  return { total: Number(count[0].total), rows };
}
