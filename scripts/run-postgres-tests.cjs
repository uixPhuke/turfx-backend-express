const { PrismaClient } = require("@prisma/client"),
  { spawnSync } = require("node:child_process");
(async () => {
  const url = process.env.PLAYZA_TEST_DATABASE_URL;
  if (
    !url ||
    new URL(url).hostname !== "127.0.0.1" ||
    new URL(url).port !== "55439"
  )
    throw Error(
      "Set PLAYZA_TEST_DATABASE_URL to the isolated loopback:55439 test database",
    );
  const db = new PrismaClient({ datasourceUrl: url });
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    throw Error(
      "Isolated PostgreSQL test database is unavailable. Start it and apply migrations before running this suite.",
    );
  } finally {
    await db.$disconnect();
  }
  const result = spawnSync(
    process.execPath,
    [
      "--test",
      "scripts/test-postgres.cjs",
      "scripts/test-postgres-api.cjs",
      "scripts/test-platform.cjs",
    ],
    { stdio: "inherit", env: process.env },
  );
  process.exitCode = result.status ?? 1;
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
