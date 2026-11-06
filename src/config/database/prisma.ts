import { PrismaClient } from "@prisma/client";

function safeDatabaseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    throw new Error("Invalid DATABASE_URL");
  }
}
const databaseUrl = safeDatabaseUrl(
  process.env.DATABASE_URL || "postgresql://localhost/playza_unconfigured",
);
// Prisma 6 engine pools: bound each process rather than sizing by host CPUs.
if (!databaseUrl.searchParams.has("connection_limit"))
  databaseUrl.searchParams.set("connection_limit", "5");
if (!databaseUrl.searchParams.has("pool_timeout"))
  databaseUrl.searchParams.set("pool_timeout", "10");
if (!databaseUrl.searchParams.has("connect_timeout"))
  databaseUrl.searchParams.set("connect_timeout", "5");
// Imported only by PostgreSQL features; legacy startup does not switch databases.
export const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl.toString() } },
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
