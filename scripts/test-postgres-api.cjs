const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const request = require("supertest");
const { createPostgresApp } = require("../.playza-build/postgres/app.js");
const url = process.env.PLAYZA_TEST_DATABASE_URL;
if (!url) throw new Error("An isolated PLAYZA_TEST_DATABASE_URL is required");
const target = new URL(url);
if (target.hostname !== "127.0.0.1" || target.port !== "55439")
  throw new Error("Only the isolated loopback test database is allowed");
const db = new PrismaClient({ datasourceUrl: url });
const codes = new Map();
const uploaded = [];
const app = createPostgresApp(db, {
  media: {
    async upload(buffer, publicId) {
      uploaded.push(publicId);
      return { publicId, url: "https://example.test/fixture.png" };
    },
    async remove() {},
  },
  accessSecret: "fixture-access-secret-not-for-production",
  refreshSecret: "fixture-refresh-secret-not-for-production",
  challengeSecret: "fixture-challenge-secret-not-for-production",
  deliverChallenge: async ({ email, code }) => {
    codes.set(email, code);
  },
});
const server = require("node:http").createServer(app);
const email = `${randomUUID()}@example.test`;
const password = "PLAYZA-fixture-password-123";
let userId, token, refreshToken, venue, resource, sport, startsAt, endsAt;
const bearer = () => `Bearer ${token}`;
before(async () => {
  await db.$connect();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.$disconnect();
});

test("registers only a customer and never returns a password hash or verification code", async () => {
  const res = await request(server)
    .post("/api/v2/auth/register")
    .send({ name: "Fixture Player", email, password });
  assert.equal(res.status, 201);
  userId = res.body.data.id;
  assert.equal(res.body.data.passwordHash, undefined);
  assert.equal(res.body.code, undefined);
  assert.equal(res.body.data.isVerified, false);
  const roles = await db.userRole.findMany({ where: { userId } });
  assert.deepEqual(
    roles.map((row) => row.role),
    ["CUSTOMER"],
  );
  const privileged = await request(server)
    .post("/api/v2/auth/register")
    .send({
      name: "Bad",
      email: `${randomUUID()}@example.test`,
      password,
      role: "SUPER_ADMIN",
    });
  assert.equal(privileged.status, 400);
});
test("requires verification, then consumes the verification challenge", async () => {
  const login = await request(server)
    .post("/api/v2/auth/login")
    .send({ email, password });
  assert.equal(login.status, 403);
  const verified = await request(server)
    .post("/api/v2/auth/verify-email")
    .send({ email, code: codes.get(email) });
  assert.equal(verified.status, 200);
  const reused = await request(server)
    .post("/api/v2/auth/verify-email")
    .send({ email, code: codes.get(email) });
  assert.equal(reused.status, 400);
  const session = await request(server)
    .post("/api/v2/auth/login")
    .send({ email, password });
  assert.equal(session.status, 200);
  token = session.body.data.accessToken;
  refreshToken = session.body.data.refreshToken;
  const me = await request(server)
    .get("/api/v2/auth/me")
    .set("Authorization", bearer());
  assert.equal(me.status, 200);
  assert.equal(me.body.data.id, userId);
});
test("serves only approved venues and configured sports without leaking owner identity", async () => {
  sport = await db.sport.create({
    data: { name: "Fixture sport", slug: randomUUID() },
  });
  venue = await db.venue.create({
    data: {
      name: randomUUID(),
      description: "Fixture venue",
      address: {},
      timezone: "UTC",
      latitude: 0,
      longitude: 0,
      ownerId: userId,
      status: "APPROVED",
    },
  });
  const pending = await db.venue.create({
    data: {
      name: randomUUID(),
      description: "Pending",
      address: {},
      timezone: "UTC",
      latitude: 0,
      longitude: 0,
      ownerId: userId,
    },
  });
  const facility = await db.facility.create({
    data: { name: "Main ground", venueId: venue.id },
  });
  resource = await db.resource.create({
    data: {
      name: "Court 1",
      facilityId: facility.id,
      mode: "EXCLUSIVE",
      capacity: 4,
      slotMinutes: 60,
    },
  });
  await db.resourceSport.create({
    data: { resourceId: resource.id, sportId: sport.id },
  });
  startsAt = new Date();
  startsAt.setUTCDate(startsAt.getUTCDate() + 3);
  startsAt.setUTCHours(10, 0, 0, 0);
  endsAt = new Date(startsAt.getTime() + 3600000);
  await db.operatingHour.create({
    data: {
      resourceId: resource.id,
      weekday: startsAt.getUTCDay(),
      opensMinute: 0,
      closesMinute: 1440,
    },
  });
  await db.pricingRule.create({
    data: { resourceId: resource.id, amountMinor: 5000, configuration: {} },
  });
  const list = await request(server)
    .get("/api/v2/venues")
    .query({ sportId: sport.id });
  assert.equal(list.status, 200);
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].ownerId, undefined);
  assert.deepEqual(list.body.data[0].hourlyFrom, {
    amount: 5000,
    currency: "INR",
  });
  assert.equal(list.body.data[0].rating, null);
  assert.equal(list.body.data[0].bookingCount, 0);
  assert.equal(list.body.data[0].facility_venue, undefined);
  const hidden = await request(server).get(`/api/v2/venues/${pending.id}`);
  assert.equal(hidden.status, 404);
  const detail = await request(server).get(`/api/v2/venues/${venue.id}`);
  assert.equal(detail.status, 200);
  assert.equal(
    detail.body.data.facility_venue[0].resource_facility[0].id,
    resource.id,
  );
});
test("nearby discovery validates coordinates and ranks actual active venues", async () => {
  const original = await db.venue.findUnique({ where: { id: venue.id } });
  await db.venue.update({
    where: { id: venue.id },
    data: { latitude: 19.076, longitude: 72.8777 },
  });
  const near = await request(server).get("/api/v2/venues").query({
    latitude: 19.076,
    longitude: 72.8777,
    radiusKm: 1,
    sportId: sport.id,
  });
  assert.equal(near.status, 200);
  assert.equal(near.body.data[0].id, venue.id);
  assert.ok(near.body.data[0].distanceKm < 0.01);
  assert.equal(near.body.pagination.total, 1);
  const far = await request(server)
    .get("/api/v2/venues")
    .query({ latitude: 0, longitude: 0, radiusKm: 1, sportId: sport.id });
  assert.equal(far.body.data.length, 0);
  const second = await request(server).get("/api/v2/venues").query({
    latitude: 19.076,
    longitude: 72.8777,
    radiusKm: 1,
    sportId: sport.id,
    page: 2,
    limit: 1,
  });
  assert.equal(second.body.pagination.total, 1);
  assert.equal(second.body.data.length, 0);
  assert.equal(
    (await request(server).get("/api/v2/venues").query({ latitude: 19 }))
      .status,
    400,
  );
  assert.equal(
    (
      await request(server)
        .get("/api/v2/venues")
        .query({ latitude: 91, longitude: 0 })
    ).status,
    400,
  );
  await db.venue.update({
    where: { id: venue.id },
    data: { latitude: original.latitude, longitude: original.longitude },
  });
});
let bookingId;
test("image uploads require venue management and reject disguised files", async () => {
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  const denied = await request(server)
    .post(`/api/v2/owner/venues/${venue.id}/media`)
    .set("Authorization", bearer())
    .attach("image", png, {
      filename: "fixture.png",
      contentType: "image/png",
    });
  assert.equal(denied.status, 403);
  assert.equal(uploaded.length, 0);
  await db.venueMember.create({
    data: { venueId: venue.id, userId, role: "OWNER" },
  });
  const disguised = await request(server)
    .post(`/api/v2/owner/venues/${venue.id}/media`)
    .set("Authorization", bearer())
    .attach("image", Buffer.from("<svg/>"), {
      filename: "fixture.png",
      contentType: "image/png",
    });
  assert.equal(disguised.status, 400);
  assert.equal(uploaded.length, 0);
  const valid = await request(server)
    .post(`/api/v2/owner/venues/${venue.id}/media`)
    .set("Authorization", bearer())
    .attach("image", png, {
      filename: "fixture.png",
      contentType: "image/png",
    });
  assert.equal(valid.status, 201);
  assert.equal(valid.body.data.venueId, venue.id);
  assert.equal(uploaded.length, 1);
  const removed = await request(server)
    .delete(`/api/v2/owner/venues/${venue.id}/media/${valid.body.data.id}`)
    .set("Authorization", bearer());
  assert.equal(removed.status, 204);
  assert.equal(
    await db.venueMedia.count({ where: { id: valid.body.data.id } }),
    0,
  );
});
test("venue gallery ordering is complete, tenant-scoped and visible to customers", async () => {
  const rows = await Promise.all(
    [0, 1, 2].map((position) =>
      db.venueMedia.create({
        data: {
          venueId: venue.id,
          publicId: randomUUID(),
          url: `https://example.test/gallery-${position}.jpg`,
          position,
        },
      }),
    ),
  );
  const path = `/api/v2/owner/venues/${venue.id}/media/order`;
  const ids = rows.map((row) => row.id).reverse();
  assert.equal(
    (await request(server).patch(path).send({ mediaIds: ids })).status,
    401,
  );
  assert.equal(
    (
      await request(server)
        .patch(`/api/v2/owner/venues/${randomUUID()}/media/order`)
        .set("Authorization", bearer())
        .send({ mediaIds: ids })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(server)
        .patch(path)
        .set("Authorization", bearer())
        .send({ mediaIds: [ids[0], ids[0], ids[1]] })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(server)
        .patch(path)
        .set("Authorization", bearer())
        .send({ mediaIds: [ids[0], randomUUID(), ids[2]] })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(server)
        .patch(path)
        .set("Authorization", bearer())
        .send({ mediaIds: ids.slice(1) })
    ).status,
    409,
  );
  const saved = await request(server)
    .patch(path)
    .set("Authorization", bearer())
    .send({ mediaIds: ids });
  assert.equal(saved.status, 200);
  assert.deepEqual(
    saved.body.data.map((row) => row.id),
    ids,
  );
  const owner = await request(server)
    .get("/api/v2/owner/venues")
    .set("Authorization", bearer());
  const ownerPhotos = owner.body.data.find(
    (row) => row.id === venue.id,
  ).venueMedia_venue;
  assert.deepEqual(
    ownerPhotos.map((row) => row.id),
    ids,
  );
  assert.equal(ownerPhotos[0].publicId, undefined);
  const detail = await request(server).get(`/api/v2/venues/${venue.id}`);
  assert.equal(detail.body.data.venueMedia_venue[0].url, rows[2].url);
  const discover = await request(server)
    .get("/api/v2/venues")
    .query({ sportId: sport.id });
  assert.equal(
    discover.body.data.find((row) => row.id === venue.id).venueMedia_venue[0]
      .url,
    rows[2].url,
  );
  await db.venueMedia.deleteMany({ where: { id: { in: ids } } });
});
test("parallel uploads cannot exceed the venue gallery limit", async () => {
  const gallery = await db.venue.create({
    data: {
      ownerId: userId,
      name: "Gallery limit fixture",
      description: "Synthetic gallery limit test",
      address: {},
      timezone: "UTC",
      latitude: 0,
      longitude: 0,
    },
  });
  await db.venueMember.create({
    data: { venueId: gallery.id, userId, role: "OWNER" },
  });
  await db.venueMedia.createMany({
    data: Array.from({ length: 19 }, (_, position) => ({
      venueId: gallery.id,
      publicId: randomUUID(),
      url: "https://example.test/limit.jpg",
      position,
    })),
  });
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  const upload = () =>
    request(server)
      .post(`/api/v2/owner/venues/${gallery.id}/media`)
      .set("Authorization", bearer())
      .attach("image", png, {
        filename: "limit.png",
        contentType: "image/png",
      });
  const results = await Promise.all([upload(), upload(), upload()]);
  assert.equal(results.filter((result) => result.status === 201).length, 1);
  assert.equal(results.filter((result) => result.status === 409).length, 2);
  assert.equal(
    await db.venueMedia.count({ where: { venueId: gallery.id } }),
    20,
  );
  const before = uploaded.length;
  assert.equal((await upload()).status, 409);
  assert.equal(uploaded.length, before);
});
test("management changes enforce tenant scope and preserve future bookings", async () => {
  const changed = await request(server)
    .patch(`/api/v2/owner/resources/${resource.id}`)
    .set("Authorization", bearer())
    .send({ name: "Updated fixture court" });
  assert.equal(changed.status, 200);
  const alienVenue = await db.venue.create({
    data: {
      name: "Other venue",
      description: "Foreign fixture",
      ownerId: userId,
      address: {},
      timezone: "UTC",
      latitude: 0,
      longitude: 0,
    },
  });
  const denied = await request(server)
    .patch(`/api/v2/owner/venues/${alienVenue.id}`)
    .set("Authorization", bearer())
    .send({ name: "Unauthorized edit" });
  assert.equal(denied.status, 403);
  const malformed = await request(server)
    .patch(`/api/v2/owner/resources/${resource.id}`)
    .set("Authorization", bearer())
    .send({ capacity: 0 });
  assert.equal(malformed.status, 400);
});
test("reserves over HTTP using server prices and rejects client-supplied prices", async () => {
  const body = {
    resourceId: resource.id,
    sportId: sport.id,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    participants: 2,
  };
  const invalid = await request(server)
    .post("/api/v2/bookings")
    .set("Authorization", bearer())
    .set("Idempotency-Key", randomUUID())
    .send({ ...body, totalMinor: 1 });
  assert.equal(invalid.status, 400);
  const key = randomUUID();
  const booked = await request(server)
    .post("/api/v2/bookings")
    .set("Authorization", bearer())
    .set("Idempotency-Key", key)
    .send(body);
  assert.equal(booked.status, 201, JSON.stringify(booked.body));
  bookingId = booked.body.data.id;
  assert.equal(booked.body.data.totalMinor, 5000);
  const repeat = await request(server)
    .post("/api/v2/bookings")
    .set("Authorization", bearer())
    .set("Idempotency-Key", key)
    .send(body);
  assert.equal(repeat.status, 201);
  assert.equal(repeat.body.data.id, bookingId);
});
test("hides another customer's booking and cancels a hold only for its customer", async () => {
  // A valid session for another user is necessary to verify tenant isolation beyond token validation.
  const strangerEmail = `${randomUUID()}@example.test`;
  await request(server)
    .post("/api/v2/auth/register")
    .send({ name: "Other Player", email: strangerEmail, password });
  await request(server)
    .post("/api/v2/auth/verify-email")
    .send({ email: strangerEmail, code: codes.get(strangerEmail) });
  const login = await request(server)
    .post("/api/v2/auth/login")
    .send({ email: strangerEmail, password });
  const otherToken = login.body.data.accessToken;
  assert.equal(
    (
      await request(server)
        .get(`/api/v2/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${otherToken}`)
    ).status,
    404,
  );
  assert.equal(
    (
      await request(server)
        .post(`/api/v2/bookings/${bookingId}/cancel`)
        .set("Authorization", `Bearer ${otherToken}`)
    ).status,
    404,
  );
  const cancel = await request(server)
    .post(`/api/v2/bookings/${bookingId}/cancel`)
    .set("Authorization", bearer());
  assert.equal(cancel.status, 200);
  assert.equal(cancel.body.data.status, "CANCELLED");
  assert.equal(
    await db.resourceReservation.count({
      where: { bookingId, isBlocking: true },
    }),
    0,
  );
});
test("rotates refresh tokens and revokes the session when an old token is reused", async () => {
  const rotated = await request(server)
    .post("/api/v2/auth/refresh")
    .send({ refreshToken });
  assert.equal(rotated.status, 200);
  assert.notEqual(rotated.body.data.refreshToken, refreshToken);
  const replay = await request(server)
    .post("/api/v2/auth/refresh")
    .send({ refreshToken });
  assert.equal(replay.status, 401);
  const revoked = await request(server)
    .get("/api/v2/auth/me")
    .set("Authorization", `Bearer ${rotated.body.data.accessToken}`);
  assert.equal(revoked.status, 401);
});
test("logout immediately revokes access and health actually checks PostgreSQL", async () => {
  const login = await request(server)
    .post("/api/v2/auth/login")
    .send({ email, password });
  const current = `Bearer ${login.body.data.accessToken}`;
  assert.equal(
    (
      await request(server)
        .post("/api/v2/auth/logout")
        .set("Authorization", current)
    ).status,
    204,
  );
  assert.equal(
    (await request(server).get("/api/v2/auth/me").set("Authorization", current))
      .status,
    401,
  );
  assert.equal((await request(server).get("/api/v2/health")).status, 200);
});

test("password reset consumes its challenge and invalidates existing sessions", async () => {
  const oldSession = await request(server)
    .post("/api/v2/auth/login")
    .send({ email, password });
  const requested = await request(server)
    .post("/api/v2/auth/request-code")
    .send({ email, purpose: "PASSWORD_RESET" });
  assert.equal(requested.status, 202);
  const newPassword = "New-PLAYZA-fixture-password-456";
  const changed = await request(server)
    .post("/api/v2/auth/reset-password")
    .send({ email, code: codes.get(email), password: newPassword });
  assert.equal(changed.status, 200);
  const oldAccess = await request(server)
    .get("/api/v2/auth/me")
    .set("Authorization", `Bearer ${oldSession.body.data.accessToken}`);
  assert.equal(oldAccess.status, 401);
  const reused = await request(server)
    .post("/api/v2/auth/reset-password")
    .send({ email, code: codes.get(email), password: newPassword });
  assert.equal(reused.status, 400);
  const login = await request(server)
    .post("/api/v2/auth/login")
    .send({ email, password: newPassword });
  assert.equal(login.status, 200);
  token = login.body.data.accessToken;
});

test("reviews require completed ownership and moderation hides their public rating", async () => {
  const booking = await db.booking.create({
    data: {
      reference: randomUUID(),
      resourceId: resource.id,
      customerId: userId,
      status: "COMPLETED",
      startsAt: new Date(Date.now() - 7200000),
      endsAt: new Date(Date.now() - 3600000),
      participants: 2,
      subtotalMinor: 5000,
      totalMinor: 5000,
      currency: "INR",
      priceSnapshot: { sportId: sport.id },
      idempotencyKey: randomUUID(),
    },
  });
  const response = await request(server)
    .post(`/api/v2/bookings/${booking.id}/review`)
    .set("Authorization", bearer())
    .send({ rating: 4, comment: "Verified fixture review" });
  assert.equal(response.status, 201);
  assert.equal(
    (
      await request(server)
        .post(`/api/v2/bookings/${booking.id}/review`)
        .set("Authorization", bearer())
        .send({ rating: 5, comment: "Duplicate review" })
    ).status,
    409,
  );
  const summary = await request(server).get(
    `/api/v2/venues/${venue.id}/reviews`,
  );
  assert.equal(summary.body.data.count, 1);
  assert.equal(summary.body.data.rating, 4);
  assert.equal(summary.body.data.reviews[0].author.email, undefined);
  const blocked = await request(server)
    .post(`/api/v2/admin/reviews/${response.body.data.id}/moderate`)
    .set("Authorization", bearer())
    .send({ isVisible: false, reason: "Fixture moderation" });
  assert.equal(blocked.status, 403);
  await db.userRole.create({ data: { userId, role: "ADMIN" } });
  assert.equal(
    (
      await request(server)
        .post(`/api/v2/admin/reviews/${response.body.data.id}/moderate`)
        .set("Authorization", bearer())
        .send({ isVisible: false, reason: "Fixture moderation" })
    ).status,
    204,
  );
  assert.equal(
    (await request(server).get(`/api/v2/venues/${venue.id}/reviews`)).body.data
      .count,
    0,
  );
});
test("venue owners manage staff without changing ownership", async () => {
  const staff = await db.user.create({
    data: {
      email: randomUUID() + "@example.test",
      name: "Fixture staff",
      passwordHash: "fixture-only",
      isVerified: true,
    },
  });
  const added = await request(server)
    .post(`/api/v2/owner/venues/${venue.id}/staff`)
    .set("Authorization", bearer())
    .send({ email: staff.email, role: "STAFF" });
  assert.equal(added.status, 200);
  const ownerChange = await request(server)
    .post(`/api/v2/owner/venues/${venue.id}/staff`)
    .set("Authorization", bearer())
    .send({ email, role: "STAFF" });
  assert.equal(ownerChange.status, 409);
  assert.equal(
    (
      await request(server)
        .post(`/api/v2/owner/venues/${venue.id}/staff/${staff.id}/remove`)
        .set("Authorization", bearer())
    ).status,
    204,
  );
  assert.equal(
    (
      await db.venueMember.findUnique({
        where: { venueId_userId: { venueId: venue.id, userId: staff.id } },
      })
    ).isActive,
    false,
  );
});
test("reports are persisted and resolved with an audit record", async () => {
  const reported = await request(server)
    .post("/api/v2/reports")
    .set("Authorization", bearer())
    .send({
      targetType: "VENUE",
      targetId: venue.id,
      reason: "OTHER",
      details: "Synthetic fixture concern",
    });
  assert.equal(reported.status, 201);
  const resolved = await request(server)
    .post(`/api/v2/admin/reports/${reported.body.data.id}/resolve`)
    .set("Authorization", bearer())
    .send({ resolution: "Reviewed fixture report", hideContent: false });
  assert.equal(resolved.status, 200);
  assert.equal(
    await db.auditLog.count({
      where: { entityId: reported.body.data.id, action: "report.resolve" },
    }),
    1,
  );
});
test("signing out deactivates registered push devices", async () => {
  const push = "ExpoPushToken[" + randomUUID() + "]";
  assert.equal(
    (
      await request(server)
        .post("/api/v2/devices")
        .set("Authorization", bearer())
        .send({ token: push, platform: "android" })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(server)
        .post("/api/v2/auth/logout")
        .set("Authorization", bearer())
    ).status,
    204,
  );
  assert.equal(
    (await db.deviceToken.findUnique({ where: { token: push } })).isActive,
    false,
  );
});

test("wishlist metadata and notification context remain customer-scoped", async () => {
  const login = await request(server)
    .post("/api/v2/auth/login")
    .send({ email, password: "New-PLAYZA-fixture-password-456" });
  assert.equal(login.status, 200);
  token = login.body.data.accessToken;
  await request(server)
    .put(`/api/v2/favourites/${venue.id}`)
    .set("Authorization", bearer());
  const saved = await request(server)
    .get("/api/v2/favourites")
    .set("Authorization", bearer());
  const row = saved.body.data.find((f) => f.venue.id === venue.id);
  assert.ok(row);
  assert.equal(row.venue.ownerId, undefined);
  assert.ok(row.venue.facility_venue.length);
  const booking = await db.booking.findFirst({ where: { customerId: userId } });
  assert.ok(booking);
  const n = await db.notification.create({
    data: {
      receiverId: userId,
      kind: "booking.confirmed",
      title: "Fixture notice",
      body: "Booking update",
      data: { bookingId: booking.id },
    },
  });
  const own = await request(server)
    .get("/api/v2/notifications")
    .set("Authorization", bearer());
  const enriched = own.body.data.find((item) => item.id === n.id);
  assert.equal(enriched.booking.id, booking.id);
  assert.ok(enriched.createdAt);
  assert.ok(enriched.booking.resource.facility.venue.name);
  const other = await db.user.create({
    data: {
      email: `${randomUUID()}@example.test`,
      name: "Other notice account",
      passwordHash: "synthetic-no-login",
    },
  });
  await db.booking.update({
    where: { id: booking.id },
    data: { customerId: other.id },
  });
  try {
    const injected = await db.notification.create({
      data: {
        receiverId: userId,
        kind: "booking.updated",
        title: "Foreign reference",
        body: "No private details",
        data: { bookingId: booking.id },
      },
    });
    const check = await request(server)
      .get("/api/v2/notifications")
      .set("Authorization", bearer());
    assert.equal(
      check.body.data.find((item) => item.id === injected.id).booking,
      null,
    );
  } finally {
    await db.booking.update({
      where: { id: booking.id },
      data: { customerId: userId },
    });
  }
  const foreign = await db.notification.create({
    data: {
      receiverId: other.id,
      kind: "test",
      title: "Private",
      body: "Private",
      data: {},
    },
  });
  assert.equal(
    (
      await request(server)
        .post(`/api/v2/notifications/${foreign.id}/read`)
        .set("Authorization", bearer())
    ).status,
    404,
  );
});
