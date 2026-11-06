const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID, createHmac } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const {
  PlatformService,
} = require("../.playza-build/features/platform/platform.service.js");
const {
  CommunityService,
} = require("../.playza-build/features/community/community.service.js");
const {
  OutboxService,
} = require("../.playza-build/features/jobs/outbox.service.js");
const {
  AvailabilityService,
} = require("../.playza-build/features/availability/availability.service.js");
const {
  PaymentService,
} = require("../.playza-build/features/finance/payment.service.js");
const {
  ReservationService,
} = require("../.playza-build/features/reservations/reservation.service.js");
const url = process.env.PLAYZA_TEST_DATABASE_URL;
if (
  !url ||
  new URL(url).hostname !== "127.0.0.1" ||
  new URL(url).port !== "55439"
)
  throw Error("Isolated PostgreSQL test database required");
const db = new PrismaClient({ datasourceUrl: url }),
  platform = new PlatformService(db),
  community = new CommunityService(db),
  reservations = new ReservationService(db);
let admin, owner, other, player, venue, resource, sport, start, end;
const providerOrders = new Map();
let orderCalls = 0,
  refundCalls = 0;
const gateway = {
  async createOrder(input) {
    orderCalls++;
    const id = "order_" + randomUUID();
    providerOrders.set(id, input);
    return { id, ...input };
  },
  async fetchPayment(id) {
    const orderId = id.slice(4);
    const order = providerOrders.get(orderId);
    return {
      id,
      order_id: orderId,
      amount: order.amount,
      currency: order.currency,
      status: "captured",
    };
  },
  async refund(id, input) {
    refundCalls++;
    return { id: "refund_" + randomUUID(), status: "processed" };
  },
};
const finance = new PaymentService(db, {
  gateway,
  keyId: "fixture-key",
  keySecret: "fixture-secret",
  webhookSecret: "fixture-webhook",
});
before(async () => {
  async function user(name) {
    return db.user.create({
      data: {
        name,
        email: randomUUID() + "@example.test",
        passwordHash: "fixture",
        isVerified: true,
      },
    });
  }
  admin = await user("Admin");
  owner = await user("Owner");
  other = await user("Other");
  player = await user("Player");
  await db.userRole.create({ data: { userId: admin.id, role: "ADMIN" } });
  sport = await db.sport.create({
    data: { name: "Fixture sport", slug: randomUUID() },
  });
  start = new Date();
  start.setUTCDate(start.getUTCDate() + 5);
  start.setUTCHours(10, 0, 0, 0);
  end = new Date(start.getTime() + 3600000);
});
after(async () => db.$disconnect());
test("owner approval is restricted to admins and grants the owner role", async () => {
  const application = await platform.apply(owner.id, {
    businessName: "Fixture business",
    documents: [],
  });
  await assert.rejects(
    platform.reviewApplication(other.id, application.id, true, ""),
    { statusCode: 403 },
  );
  await platform.reviewApplication(
    admin.id,
    application.id,
    true,
    "Verified fixture",
  );
  assert.ok(
    await db.userRole.findUnique({
      where: { userId_role: { userId: owner.id, role: "OWNER" } },
    }),
  );
});
test("owners configure their own hierarchy and another user cannot change it", async () => {
  venue = await platform.createVenue(owner.id, {
    name: "Fixture venue",
    description: "A verified testing venue",
    address: { city: "Fixture" },
    timezone: "UTC",
    latitude: 0,
    longitude: 0,
  });
  const facility = await platform.createFacility(owner.id, {
    venueId: venue.id,
    name: "Main field",
    amenities: { parking: true },
  });
  await assert.rejects(
    platform.createFacility(other.id, {
      venueId: venue.id,
      name: "Unauthorized",
      amenities: {},
    }),
    { statusCode: 403 },
  );
  resource = await platform.createResource(owner.id, {
    facilityId: facility.id,
    name: "Field 1",
    mode: "EXCLUSIVE",
    capacity: 10,
    slotMinutes: 60,
    currency: "INR",
    sportIds: [sport.id],
  });
  await platform.hours(owner.id, resource.id, [
    { weekday: start.getUTCDay(), opensMinute: 0, closesMinute: 1440 },
  ]);
  await platform.price(owner.id, resource.id, 10000, 0, {});
  await platform.reviewVenue(admin.id, venue.id, true);
  await assert.rejects(platform.price(other.id, resource.id, 1, 0, {}), {
    statusCode: 403,
  });
});
test("availability uses configured prices and rejects invalid calendar dates", async () => {
  const service = new AvailabilityService(db),
    date = start.toISOString().slice(0, 10);
  const result = await service.list(resource.id, date, 2);
  const slot = result.slots.find(
    (s) => s.startsAt.getTime() === start.getTime(),
  );
  assert.ok(slot);
  assert.equal(slot.available, true);
  assert.equal(slot.amountMinor, 10000);
  await assert.rejects(service.list(resource.id, "2027-02-30", 2), {
    statusCode: 400,
  });
  await assert.rejects(service.list(resource.id, date, 10001), {
    statusCode: 400,
  });
});
let team, conversation;
test("team invitations can be answered only by the invited recipient", async () => {
  team = await community.team(owner.id, "Fixture team");
  conversation = team.conversationId;
  const invite = await community.invite(owner.id, team.id, player.id);
  await assert.rejects(community.respond(other.id, invite.id, true), {
    statusCode: 404,
  });
  await community.respond(player.id, invite.id, true);
  assert.ok(await community.member(player.id, conversation));
  await assert.rejects(community.respond(player.id, invite.id, true), {
    statusCode: 404,
  });
});
test("messages persist, retry idempotently and reject nonmembers", async () => {
  const key = randomUUID(),
    first = await community.message(player.id, conversation, "Hello team", key);
  const again = await community.message(
    player.id,
    conversation,
    "Hello team",
    key,
  );
  assert.equal(first.id, again.id);
  await assert.rejects(
    community.message(other.id, conversation, "Unauthorized", randomUUID()),
    { statusCode: 403 },
  );
  assert.equal(
    await db.message.count({ where: { conversationId: conversation } }),
    1,
  );
});
test("concurrent game acceptance cannot exceed the participant limit", async () => {
  const game = await community.game(owner.id, {
    title: "Fixture match",
    sportId: sport.id,
    startsAt: start,
    endsAt: end,
    participantLimit: 2,
    visibility: "PUBLIC",
  });
  await community.requestJoin(player.id, game.id);
  await community.requestJoin(other.id, game.id);
  const results = await Promise.allSettled([
    community.acceptPlayer(owner.id, game.id, player.id),
    community.acceptPlayer(owner.id, game.id, other.id),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    await db.gameParticipant.count({
      where: { gameId: game.id, status: "CONFIRMED" },
    }),
    2,
  );
});
let paidBooking, payment, latePayment;
test("orders use canonical prices and payment capture confirms a held allocation exactly once", async () => {
  paidBooking = await reservations.reserve({
    customerId: player.id,
    resourceId: resource.id,
    sportId: sport.id,
    startsAt: start,
    endsAt: end,
    participants: 2,
    idempotencyKey: randomUUID(),
  });
  payment = await finance.order(player.id, paidBooking.id, randomUUID());
  assert.equal(payment.amountMinor, 10000);
  const again = await finance.order(player.id, paidBooking.id, randomUUID());
  assert.equal(again.id, payment.id);
  assert.equal(orderCalls, 1);
  const paymentId = "pay_" + payment.providerOrderId,
    signature = createHmac("sha256", "fixture-secret")
      .update(payment.providerOrderId + "|" + paymentId)
      .digest("hex");
  await assert.rejects(
    finance.verify(other.id, {
      paymentId: payment.id,
      gatewayPaymentId: paymentId,
      gatewayOrderId: payment.providerOrderId,
      signature,
    }),
    { statusCode: 404 },
  );
  const result = await finance.verify(player.id, {
    paymentId: payment.id,
    gatewayPaymentId: paymentId,
    gatewayOrderId: payment.providerOrderId,
    signature,
  });
  assert.equal(result.booking.status, "CONFIRMED");
  await finance.verify(player.id, {
    paymentId: payment.id,
    gatewayPaymentId: paymentId,
    gatewayOrderId: payment.providerOrderId,
    signature,
  });
  assert.equal(
    await db.outboxEvent.count({
      where: { aggregateId: paidBooking.id, topic: "booking.confirmed" },
    }),
    1,
  );
});
test("signed webhooks are recorded durably and duplicates do not repeat transitions", async () => {
  const entity = await gateway.fetchPayment("pay_" + payment.providerOrderId),
    eventId = randomUUID();
  const raw = Buffer.from(
    JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity } },
    }),
  );
  const signature = createHmac("sha256", "fixture-webhook")
    .update(raw)
    .digest("hex");
  await finance.webhook(raw, signature, eventId);
  await finance.webhook(raw, signature, eventId);
  assert.equal(
    await db.paymentWebhookEvent.count({ where: { providerEventId: eventId } }),
    1,
  );
  assert.equal(
    await db.outboxEvent.count({
      where: { aggregateId: paidBooking.id, topic: "booking.confirmed" },
    }),
    1,
  );
  await assert.rejects(finance.webhook(raw, "0".repeat(64), randomUUID()), {
    statusCode: 400,
  });
});
test("partial and full refunds are provider-backed and bounded by the captured amount", async () => {
  const first = await finance.refund(
    payment.id,
    6000,
    "Fixture partial refund",
    randomUUID(),
  );
  assert.equal(first.status, "PROCESSED");
  assert.equal(
    (await db.payment.findUnique({ where: { id: payment.id } })).status,
    "PARTIALLY_REFUNDED",
  );
  await assert.rejects(
    finance.refund(payment.id, 5000, "Too large", randomUUID()),
    { statusCode: 409 },
  );
  const finalKey = randomUUID();
  const finalRefund = await finance.refund(
    payment.id,
    4000,
    "Fixture remaining refund",
    finalKey,
  );
  assert.equal(
    (
      await finance.refund(
        payment.id,
        4000,
        "Fixture remaining refund",
        finalKey,
      )
    ).id,
    finalRefund.id,
  );
  assert.equal(
    (await db.payment.findUnique({ where: { id: payment.id } })).status,
    "REFUNDED",
  );
  assert.equal(refundCalls, 2);
});
test("late captured payments never resurrect an expired booking", async () => {
  const begins = new Date(end),
    finishes = new Date(begins.getTime() + 3600000);
  const booking = await reservations.reserve({
    customerId: player.id,
    resourceId: resource.id,
    sportId: sport.id,
    startsAt: begins,
    endsAt: finishes,
    participants: 2,
    idempotencyKey: randomUUID(),
  });
  const order = await finance.order(player.id, booking.id, randomUUID());
  await db.booking.update({
    where: { id: booking.id },
    data: { holdExpiresAt: new Date(Date.now() - 1000) },
  });
  await reservations.expireHold(booking.id);
  latePayment = order;
  const captured = await gateway.fetchPayment("pay_" + order.providerOrderId);
  const result = await finance.capture(captured);
  assert.equal(result.booking.status, "EXPIRED");
  assert.equal(result.payment.metadata.requiresRefund, true);
  assert.equal(
    await db.resourceReservation.count({
      where: { bookingId: booking.id, isBlocking: true },
    }),
    0,
  );
});

test("parallel outbox delivery commits one notification and acknowledgement per event", async () => {
  const service = new OutboxService(db);
  await Promise.all([service.drain(1000), service.drain(1000)]);
  const events = await db.outboxEvent.findMany({
    where: { aggregateId: paidBooking.id, topic: "booking.confirmed" },
  });
  assert.equal(events.length, 1);
  assert.ok(events[0].processedAt);
  const notifications = await db.notification.findMany({
    where: { receiverId: player.id, kind: "booking.confirmed" },
  });
  assert.equal(
    notifications.filter((n) => n.data.eventId === events[0].id).length,
    1,
  );
});

test("realtime chat enforces membership and rejects a revoked session", async () => {
  const { createServer } = require("node:http");
  const { io } = require("socket.io-client");
  const bcrypt = require("bcryptjs");
  const {
    AuthService,
  } = require("../.playza-build/features/identity/auth.service.js");
  const {
    attachRealtime,
  } = require("../.playza-build/features/community/realtime.js");
  const options = {
    accessSecret: "a".repeat(64),
    refreshSecret: "b".repeat(64),
    challengeSecret: "c".repeat(64),
    deliverChallenge: async () => {},
  };
  await db.user.update({
    where: { id: player.id },
    data: { passwordHash: await bcrypt.hash("fixture-password-long", 12) },
  });
  const auth = new AuthService(db, options),
    session = await auth.login(
      player.email,
      "fixture-password-long",
      "integration-test",
    );
  const server = createServer(),
    realtime = attachRealtime(server, db, options, []);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const socket = io(`http://127.0.0.1:${server.address().port}`, {
    auth: { token: session.accessToken },
    transports: ["websocket"],
    reconnection: false,
  });
  async function bounded(promise) {
    let timer;
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(Error("Realtime test timed out")),
            4000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  const ack = (event, data) =>
    bounded(new Promise((resolve) => socket.emit(event, data, resolve)));
  try {
    await bounded(
      new Promise((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("connect_error", reject);
      }),
    );
    const foreign = await community.conversation(other.id, "Private room", [
      admin.id,
    ]);
    assert.equal((await ack("conversation:join", foreign.id)).ok, false);
    assert.equal((await ack("conversation:join", conversation)).ok, true);
    const received = bounded(
      new Promise((resolve) => socket.once("message:new", resolve)),
    );
    const sent = await ack("message:send", {
      conversationId: conversation,
      body: "Socket fixture",
      clientMessageId: randomUUID(),
    });
    assert.equal(sent.ok, true);
    assert.equal((await received).id, sent.data.id);
    const identity = await auth.authenticate(session.accessToken);
    await auth.logout(identity.sessionId);
    assert.equal(
      (
        await ack("message:send", {
          conversationId: conversation,
          body: "Must not persist",
          clientMessageId: randomUUID(),
        })
      ).ok,
      false,
    );
    assert.equal(
      await db.message.count({
        where: { conversationId: conversation, body: "Must not persist" },
      }),
      0,
    );
  } finally {
    socket.disconnect();
    await realtime.close();
    if (server.listening) await new Promise((resolve) => server.close(resolve));
  }
});

test("multi-slot reservations price each peak window and match availability", async () => {
  const begins = new Date(start);
  begins.setUTCHours(14);
  const finishes = new Date(begins.getTime() + 7200000);
  await platform.price(owner.id, resource.id, 20000, 10, {
    fromMinute: 15 * 60,
    toMinute: 16 * 60,
  });
  const booking = await reservations.reserve({
    customerId: player.id,
    resourceId: resource.id,
    sportId: sport.id,
    startsAt: begins,
    endsAt: finishes,
    participants: 2,
    idempotencyKey: randomUUID(),
  });
  assert.equal(booking.totalMinor, 30000);
  assert.equal(booking.priceSnapshot.lines.length, 2);
  await reservations.cancelHold(player.id, booking.id);
  const availability = await new AvailabilityService(db).list(
    resource.id,
    begins.toISOString().slice(0, 10),
    2,
  );
  const slots = availability.slots.filter(
    (s) => s.startsAt >= begins && s.endsAt <= finishes,
  );
  assert.equal(slots.length, 2);
  assert.equal(
    slots.reduce((sum, s) => sum + s.amountMinor, 0),
    booking.totalMinor,
  );
});

test("late-capture reconciliation refunds once without resurrecting the booking", async () => {
  await finance.reconcile(10000);
  assert.equal(
    (await db.payment.findUnique({ where: { id: latePayment.id } })).status,
    "REFUNDED",
  );
  const count = refundCalls;
  await finance.reconcile(10000);
  assert.equal(refundCalls, count);
  assert.equal(
    (await db.booking.findUnique({ where: { id: latePayment.bookingId } }))
      .status,
    "EXPIRED",
  );
  assert.equal(
    await db.outboxEvent.count({
      where: {
        topic: "payment.late_capture",
        aggregateId: latePayment.id,
        processedAt: null,
      },
    }),
    0,
  );
});

test("customer cancellation refunds before 24 hours and releases the allocation only once", async () => {
  const {
    CancellationService,
  } = require("../.playza-build/features/reservations/cancellation.service.js");
  const service = new CancellationService(db);
  const begins = new Date(start);
  begins.setUTCHours(20);
  const finishes = new Date(begins.getTime() + 3600000);
  const booking = await reservations.reserve({
    customerId: player.id,
    resourceId: resource.id,
    sportId: sport.id,
    startsAt: begins,
    endsAt: finishes,
    participants: 2,
    idempotencyKey: randomUUID(),
  });
  const order = await finance.order(player.id, booking.id, randomUUID());
  await finance.capture(
    await gateway.fetchPayment("pay_" + order.providerOrderId),
  );
  const game = await community.game(player.id, {
    title: "Reserved fixture",
    sportId: sport.id,
    startsAt: begins,
    endsAt: finishes,
    participantLimit: 2,
    visibility: "PUBLIC",
    bookingId: booking.id,
  });
  assert.equal(
    (await service.preview(player.id, booking.id)).refundMinor,
    10000,
  );
  await assert.rejects(service.cancel(other.id, booking.id, "Not my booking"), {
    statusCode: 404,
  });
  await Promise.all([
    service.cancel(player.id, booking.id, "Changed plans"),
    service.cancel(player.id, booking.id, "Changed plans"),
  ]);
  assert.equal(
    await db.outboxEvent.count({
      where: { topic: "payment.customer_cancellation", aggregateId: order.id },
    }),
    1,
  );
  assert.equal(
    await db.resourceReservation.count({
      where: { bookingId: booking.id, isBlocking: true },
    }),
    0,
  );
  assert.equal(
    (await db.game.findUnique({ where: { id: game.id } })).status,
    "CANCELLED",
  );
  await finance.reconcile(10000);
  assert.equal(
    (await db.payment.findUnique({ where: { id: order.id } })).status,
    "REFUNDED",
  );
});
test("cancellation cutoff is inclusive at 24 hours and denies refunds after the cutoff", async () => {
  const {
    CancellationService,
  } = require("../.playza-build/features/reservations/cancellation.service.js");
  const service = new CancellationService(db);
  const begins = new Date(
      Math.ceil(Date.now() / 3600000) * 3600000 + 2 * 3600000,
    ),
    finishes = new Date(begins.getTime() + 3600000);
  await platform.hours(
    owner.id,
    resource.id,
    Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      opensMinute: 0,
      closesMinute: 1440,
    })),
  );
  const booking = await reservations.reserve({
    customerId: player.id,
    resourceId: resource.id,
    sportId: sport.id,
    startsAt: begins,
    endsAt: finishes,
    participants: 2,
    idempotencyKey: randomUUID(),
  });
  const boundary = new Date(begins.getTime() - 86400000);
  assert.equal(service.policy(booking, boundary).refundEligible, true);
  assert.equal(
    service.policy(booking, new Date(boundary.getTime() + 1)).refundEligible,
    false,
  );
  const order = await finance.order(player.id, booking.id, randomUUID());
  await finance.capture(
    await gateway.fetchPayment("pay_" + order.providerOrderId),
  );
  assert.equal((await service.preview(player.id, booking.id)).refundMinor, 0);
  await service.cancel(player.id, booking.id, "Late change");
  assert.equal(
    await db.outboxEvent.count({
      where: { topic: "payment.customer_cancellation", aggregateId: order.id },
    }),
    0,
  );
  assert.equal(
    (await db.payment.findUnique({ where: { id: order.id } })).status,
    "CAPTURED",
  );
});

test("coupon limits are atomic and tax/fee totals are computed on the server", async () => {
  const coupon = await db.coupon.create({
    data: {
      code: randomUUID().replaceAll("-", "").toUpperCase(),
      kind: "PERCENT_BPS",
      value: 2500,
      usageLimit: 1,
      usagePerUser: 1,
      validFrom: new Date(Date.now() - 1000),
      validUntil: new Date(Date.now() + 86400000),
    },
  });
  const engine = new ReservationService(db, {
    taxBasisPoints: 1000,
    feeMinor: 500,
  });
  const begins = new Date(start);
  begins.setUTCHours(18);
  const commands = [player, other].map((user, index) => ({
    customerId: user.id,
    resourceId: resource.id,
    sportId: sport.id,
    startsAt: new Date(begins.getTime() + index * 3600000),
    endsAt: new Date(begins.getTime() + (index + 1) * 3600000),
    participants: 2,
    couponCode: coupon.code,
    idempotencyKey: randomUUID(),
  }));
  const results = await Promise.allSettled(
    commands.map((command) => engine.reserve(command)),
  );
  const success = results.find((r) => r.status === "fulfilled");
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(success.value.subtotalMinor, 10000);
  assert.equal(success.value.discountMinor, 2500);
  assert.equal(success.value.taxMinor, 750);
  assert.equal(success.value.feeMinor, 500);
  assert.equal(success.value.totalMinor, 8750);
  assert.equal(
    await db.couponRedemption.count({ where: { couponId: coupon.id } }),
    1,
  );
  await engine.cancelHold(success.value.customerId, success.value.id);
  const again = await engine.reserve({
    ...commands.find((c) => c.customerId === success.value.customerId),
    idempotencyKey: randomUUID(),
  });
  assert.equal(again.totalMinor, 8750);
  await engine.cancelHold(again.customerId, again.id);
});
test("a fully discounted booking confirms without a fake payment", async () => {
  const coupon = await db.coupon.create({
    data: {
      code: randomUUID().replaceAll("-", "").toUpperCase(),
      kind: "PERCENT_BPS",
      value: 10000,
      validFrom: new Date(Date.now() - 1000),
      validUntil: new Date(Date.now() + 86400000),
    },
  });
  const begins = new Date(start);
  begins.setUTCHours(21);
  const booking = await reservations.reserve({
    customerId: player.id,
    resourceId: resource.id,
    sportId: sport.id,
    startsAt: begins,
    endsAt: new Date(begins.getTime() + 3600000),
    participants: 2,
    couponCode: coupon.code,
    idempotencyKey: randomUUID(),
  });
  assert.equal(booking.totalMinor, 0);
  assert.equal(booking.status, "CONFIRMED");
  assert.equal(booking.holdExpiresAt, null);
  assert.equal(await db.payment.count({ where: { bookingId: booking.id } }), 0);
});

test("team lifecycle protects the last administrator and revokes removed chat membership", async () => {
  const {
    CommunityLifecycle,
  } = require("../.playza-build/features/community/lifecycle.service.js");
  const service = new CommunityLifecycle(db);
  await assert.rejects(
    service.teamMember(owner.id, team.id, owner.id, "REMOVE"),
    { statusCode: 409 },
  );
  await service.teamMember(owner.id, team.id, player.id, "ADMIN");
  await service.teamMember(owner.id, team.id, owner.id, "REMOVE");
  await assert.rejects(community.member(owner.id, conversation), {
    statusCode: 403,
  });
  await assert.rejects(
    service.teamMember(other.id, team.id, player.id, "REMOVE"),
    { statusCode: 403 },
  );
  assert.equal(
    await db.teamMember.count({ where: { teamId: team.id, role: "ADMIN" } }),
    1,
  );
});
test("private game invitation acceptance is recipient-scoped and capacity-safe", async () => {
  const {
    CommunityLifecycle,
  } = require("../.playza-build/features/community/lifecycle.service.js");
  const service = new CommunityLifecycle(db);
  const game = await community.game(owner.id, {
    title: "Private fixture",
    sportId: sport.id,
    startsAt: start,
    endsAt: end,
    participantLimit: 2,
    visibility: "PRIVATE",
  });
  await assert.rejects(service.gameAccess(other.id, game.id), {
    statusCode: 404,
  });
  const invite = await service.inviteGame(owner.id, game.id, player.id);
  await assert.rejects(community.respond(other.id, invite.id, true), {
    statusCode: 404,
  });
  await community.respond(player.id, invite.id, true);
  assert.equal(
    (await service.gameAccess(player.id, game.id)).gameParticipant_game.filter(
      (p) => p.status === "CONFIRMED",
    ).length,
    2,
  );
  await service.leaveGame(player.id, game.id);
  await assert.rejects(
    community.member(
      player.id,
      (await db.conversation.findFirst({ where: { gameId: game.id } })).id,
    ),
    { statusCode: 403 },
  );
  await service.cancelGame(owner.id, game.id);
  assert.equal(
    (await db.game.findUnique({ where: { id: game.id } })).status,
    "CANCELLED",
  );
});
test("direct-message blocking applies to new and existing conversations", async () => {
  const direct = await community.conversation(player.id, "Direct fixture", [
    other.id,
  ]);
  await db.userBlock.create({
    data: { blockerId: other.id, blockedId: player.id },
  });
  await assert.rejects(
    community.message(player.id, direct.id, "Blocked message", randomUUID()),
    { statusCode: 403 },
  );
  await assert.rejects(
    community.conversation(player.id, "New bypass attempt", [other.id]),
    { statusCode: 403 },
  );
  assert.equal(
    await db.message.count({ where: { conversationId: direct.id } }),
    0,
  );
});

test("an order lost after provider creation is recovered by receipt without creating another order", async () => {
  const begins = new Date(start);
  begins.setUTCHours(23);
  const booking = await reservations.reserve({
    customerId: player.id,
    resourceId: resource.id,
    sportId: sport.id,
    startsAt: begins,
    endsAt: new Date(begins.getTime() + 3600000),
    participants: 2,
    idempotencyKey: randomUUID(),
  });
  let creates = 0;
  const provider = {
    ...gateway,
    async createOrder(input) {
      creates++;
      const order = await gateway.createOrder(input);
      throw Error("Response lost after creation");
    },
    async findOrder(receipt) {
      for (const [id, order] of providerOrders)
        if (order.receipt === receipt)
          return { id, amount: order.amount, currency: order.currency };
      return null;
    },
    async orderPayments(orderId) {
      return [await gateway.fetchPayment("pay_" + orderId)];
    },
  };
  const service = new PaymentService(db, { gateway: provider });
  await assert.rejects(service.order(player.id, booking.id, randomUUID()), {
    statusCode: 502,
  });
  const payment = await db.payment.findFirst({
    where: { bookingId: booking.id },
  });
  await db.payment.update({
    where: { id: payment.id },
    data: { createdAt: new Date(Date.now() - 120000) },
  });
  await service.reconcile(10000);
  assert.equal(creates, 1);
  assert.equal(
    (await db.booking.findUnique({ where: { id: booking.id } })).status,
    "CONFIRMED",
  );
  assert.equal(
    (await db.payment.findUnique({ where: { id: payment.id } })).status,
    "CAPTURED",
  );
});

test("push delivery records tickets, checks receipts and disables unregistered devices", async () => {
  const {
    PushService,
  } = require("../.playza-build/features/notifications/push.service.js");
  const device = await db.deviceToken.create({
    data: {
      userId: player.id,
      token: `ExpoPushToken[${randomUUID()}]`,
      platform: "android",
    },
  });
  const note = await db.notification.create({
    data: {
      receiverId: player.id,
      kind: "fixture",
      title: "Fixture update",
      body: "Synthetic test",
      createdAt: new Date("2000-01-01T00:00:00Z"),
    },
  });
  let sent = 0;
  const provider = {
    async send() {
      sent++;
      return { status: "ok", id: "ticket-fixture" };
    },
    async receipts() {
      return {
        "ticket-fixture": {
          status: "error",
          details: { error: "DeviceNotRegistered" },
        },
      };
    },
  };
  const push = new PushService(db, provider);
  await push.prepare(1);
  await Promise.all([push.sendOne(), push.sendOne()]);
  assert.equal(sent, 1);
  const row = await db.pushDelivery.findUnique({
    where: {
      notificationId_deviceTokenId: {
        notificationId: note.id,
        deviceTokenId: device.id,
      },
    },
  });
  assert.equal(row.status, "SENT");
  await db.pushDelivery.update({
    where: { id: row.id },
    data: { availableAt: new Date(Date.now() - 1000) },
  });
  await push.checkReceipts();
  assert.equal(
    (await db.pushDelivery.findUnique({ where: { id: row.id } })).status,
    "FAILED",
  );
  assert.equal(
    (await db.deviceToken.findUnique({ where: { id: device.id } })).isActive,
    false,
  );
});

test("signed booking tickets enforce venue authorization, time windows and one-time check-in", async () => {
  const {
    TicketService,
  } = require("../.playza-build/features/tickets/ticket.service.js");
  const booking = await db.booking.findFirst({
    where: { customerId: player.id, status: "CONFIRMED", checkedInAt: null },
    orderBy: { startsAt: "desc" },
  });
  assert.ok(booking);
  const at = new Date(booking.startsAt.getTime() - 600000),
    tickets = new TicketService(
      db,
      "fixture-ticket-key-not-for-production",
      () => at,
    );
  const ticket = await tickets.issue(player.id, booking.id);
  await assert.rejects(tickets.issue(other.id, booking.id), {
    statusCode: 404,
  });
  await assert.rejects(tickets.checkIn(other.id, ticket.token), {
    statusCode: 403,
  });
  await assert.rejects(
    tickets.checkIn(owner.id, ticket.token.slice(0, -5) + "xxxxx"),
    { statusCode: 400 },
  );
  const result = await tickets.checkIn(owner.id, ticket.token);
  assert.equal(result.reference, booking.reference);
  await assert.rejects(tickets.checkIn(owner.id, ticket.token), {
    statusCode: 409,
  });
  assert.equal(
    await db.auditLog.count({
      where: { entityId: booking.id, action: "booking.check_in" },
    }),
    1,
  );
});
