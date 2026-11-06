const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const {
  ReservationService,
} = require("../.playza-build/features/reservations/reservation.service.js");
const url = process.env.PLAYZA_TEST_DATABASE_URL;
if (!url)
  throw new Error(
    "PLAYZA_TEST_DATABASE_URL must identify the isolated PostgreSQL test instance",
  );
const parsed = new URL(url);
if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55439") {
  throw new Error(
    "This fixture runner only allows the isolated loopback PostgreSQL instance on port 55439",
  );
}
const db = new PrismaClient({ datasourceUrl: url });
const service = new ReservationService(db);
let customer, sport, exclusive, shared, startsAt, endsAt;
before(async () => {
  const suffix = randomUUID();
  customer = await db.user.create({
    data: {
      name: "Fixture",
      email: `${suffix}@example.test`,
      passwordHash: "fixture-hash",
      isVerified: true,
    },
  });
  sport = await db.sport.create({ data: { name: "Football", slug: suffix } });
  const venue = await db.venue.create({
    data: {
      name: "Fixture venue",
      description: "Isolated test",
      ownerId: customer.id,
      address: {},
      timezone: "UTC",
      latitude: 0,
      longitude: 0,
      status: "APPROVED",
    },
  });
  const facility = await db.facility.create({
    data: { name: "Fixture facility", venueId: venue.id },
  });
  startsAt = new Date();
  startsAt.setUTCDate(startsAt.getUTCDate() + 2);
  startsAt.setUTCHours(10, 0, 0, 0);
  endsAt = new Date(startsAt.getTime() + 3600000);
  async function resource(mode) {
    const row = await db.resource.create({
      data: {
        name: mode,
        facilityId: facility.id,
        mode,
        capacity: mode === "EXCLUSIVE" ? 12 : 3,
        slotMinutes: 60,
      },
    });
    await db.resourceSport.create({
      data: { resourceId: row.id, sportId: sport.id },
    });
    await db.operatingHour.create({
      data: {
        resourceId: row.id,
        weekday: startsAt.getUTCDay(),
        opensMinute: 0,
        closesMinute: 1440,
      },
    });
    await db.pricingRule.create({
      data: { resourceId: row.id, amountMinor: 10000, configuration: {} },
    });
    return row;
  }
  exclusive = await resource("EXCLUSIVE");
  shared = await resource("CAPACITY_BASED");
  await db.capacitySession.create({
    data: { resourceId: shared.id, startsAt, endsAt, capacity: 3 },
  });
});
after(async () => db.$disconnect());
const command = (resource, changes = {}) => ({
  customerId: customer.id,
  resourceId: resource.id,
  sportId: sport.id,
  startsAt,
  endsAt,
  participants: 2,
  idempotencyKey: randomUUID(),
  ...changes,
});

test("concurrent exclusive requests produce one booking and one conflict", async () => {
  const results = await Promise.allSettled([
    service.reserve(command(exclusive)),
    service.reserve(command(exclusive)),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  const failure = results.find((result) => result.status === "rejected");
  assert.equal(failure.reason.statusCode, 409, failure.reason.stack);
  assert.equal(
    await db.resourceReservation.count({
      where: { resourceId: exclusive.id, isBlocking: true },
    }),
    1,
  );
});
test("capacity reservations cannot oversubscribe a shared session", async () => {
  const results = await Promise.allSettled([
    service.reserve(command(shared)),
    service.reserve(command(shared)),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  const session = await db.capacitySession.findFirst({
    where: { resourceId: shared.id },
  });
  assert.equal(session.reserved, 2);
});
test("retries with one idempotency key create one booking and one outbox event", async () => {
  const shifted = new Date(endsAt);
  const finish = new Date(shifted.getTime() + 3600000);
  const input = command(exclusive, { startsAt: shifted, endsAt: finish });
  const [first, retry] = await Promise.all([
    service.reserve(input),
    service.reserve(input),
  ]);
  assert.equal(first.id, retry.id);
  assert.equal(first.totalMinor, 10000);
  assert.equal(
    await db.outboxEvent.count({
      where: { aggregateId: first.id, topic: "booking.held" },
    }),
    1,
  );
  await assert.rejects(service.reserve({ ...input, participants: 3 }), {
    statusCode: 409,
  });
});
test("expiration releases capacity exactly once", async () => {
  const booking = await db.booking.findFirst({
    where: { resourceId: shared.id },
  });
  await db.booking.update({
    where: { id: booking.id },
    data: { holdExpiresAt: new Date(Date.now() - 1000) },
  });
  const results = await Promise.all([
    service.expireHold(booking.id),
    service.expireHold(booking.id),
  ]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(
    (await db.capacitySession.findFirst({ where: { resourceId: shared.id } }))
      .reserved,
    0,
  );
});
test("blocked and unverified customers cannot reserve", async () => {
  await db.user.update({
    where: { id: customer.id },
    data: { isVerified: false },
  });
  await assert.rejects(service.reserve(command(shared)), { statusCode: 403 });
  await db.user.update({
    where: { id: customer.id },
    data: { isVerified: true },
  });
});
test("database rejects negative prices and over-capacity counters", async () => {
  await assert.rejects(
    db.pricingRule.create({
      data: { resourceId: exclusive.id, amountMinor: -1, configuration: {} },
    }),
  );
  const session = await db.capacitySession.findFirst({
    where: { resourceId: shared.id },
  });
  await assert.rejects(
    db.capacitySession.update({
      where: { id: session.id },
      data: { reserved: 4 },
    }),
  );
});
test("audit records are immutable at the database boundary", async () => {
  const audit = await db.auditLog.create({
    data: {
      actorId: customer.id,
      action: "fixture",
      entityType: "User",
      entityId: customer.id,
    },
  });
  await assert.rejects(
    db.auditLog.update({
      where: { id: audit.id },
      data: { action: "tampered" },
    }),
  );
  await assert.rejects(db.auditLog.delete({ where: { id: audit.id } }));
});

test("database rejects overlapping shared sessions and capacity above the resource limit", async () => {
  const halfPast = new Date(startsAt.getTime() + 1800000);
  await assert.rejects(
    db.capacitySession.create({
      data: {
        resourceId: shared.id,
        startsAt: halfPast,
        endsAt: new Date(halfPast.getTime() + 3600000),
        capacity: 3,
      },
    }),
  );
  await assert.rejects(
    db.capacitySession.create({
      data: {
        resourceId: shared.id,
        startsAt: endsAt,
        endsAt: new Date(endsAt.getTime() + 3600000),
        capacity: 4,
      },
    }),
  );
});
test("database rejects a reservation whose exception belongs to another resource", async () => {
  const start = new Date(startsAt.getTime() + 6 * 3600000),
    end = new Date(start.getTime() + 3600000);
  const exception = await db.availabilityException.create({
    data: {
      resourceId: shared.id,
      startsAt: start,
      endsAt: end,
      reason: "Fixture maintenance",
    },
  });
  await assert.rejects(
    db.resourceReservation.create({
      data: {
        resourceId: exclusive.id,
        exceptionId: exception.id,
        startsAt: start,
        endsAt: end,
      },
    }),
  );
});
test("expiry sweeps release exclusive holds and write one expiry event", async () => {
  const start = new Date(startsAt.getTime() + 4 * 3600000),
    end = new Date(start.getTime() + 3600000);
  const booking = await service.reserve(
    command(exclusive, { startsAt: start, endsAt: end }),
  );
  await db.booking.update({
    where: { id: booking.id },
    data: { holdExpiresAt: new Date(Date.now() - 1000) },
  });
  await service.expireDueHolds(1000);
  assert.equal(
    (await db.booking.findUnique({ where: { id: booking.id } })).status,
    "EXPIRED",
  );
  assert.equal(
    await db.resourceReservation.count({
      where: { bookingId: booking.id, isBlocking: true },
    }),
    0,
  );
  assert.equal(
    await db.outboxEvent.count({
      where: { aggregateId: booking.id, topic: "booking.expired" },
    }),
    1,
  );
});
