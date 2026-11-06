const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createPostgresApp } = require("../.playza-build/postgres/app");
const { runtimeEnv } = require("../.playza-build/postgres/runtime");
const opts = {
  accessSecret: "a".repeat(40),
  refreshSecret: "b".repeat(40),
  challengeSecret: "c".repeat(40),
  deliverChallenge: async () => {},
};
test("readiness fails closed for Redis and draining, while liveness remains available", async () => {
  const db = { $queryRaw: async () => [1] };
  const app = createPostgresApp(db, {
    ...opts,
    checkReadiness: async () => {
      throw Error("redis://private-secret");
    },
  });
  const live = await request(app).get("/api/v2/live");
  assert.equal(live.status, 200);
  const ready = await request(app).get("/api/v2/ready");
  assert.equal(ready.status, 503);
  assert.ok(!JSON.stringify(ready.body).includes("private-secret"));
  assert.equal(
    (
      await request(
        createPostgresApp(db, { ...opts, isDraining: () => true }),
      ).get("/api/v2/ready")
    ).status,
    503,
  );
});
test("invalid JSON and oversized requests preserve safe request IDs and headers", async () => {
  const app = createPostgresApp({}, opts);
  for (const body of ["{", JSON.stringify({ data: "x".repeat(270000) })]) {
    const res = await request(app)
      .post("/api/v2/auth/login")
      .set("Content-Type", "application/json")
      .send(body);
    assert.ok([400, 413].includes(res.status));
    assert.ok(res.headers["x-request-id"]);
    assert.equal(res.headers["x-content-type-options"], "nosniff");
    assert.ok(!JSON.stringify(res.body).includes("stack"));
  }
});
test("deployed worker rejects live payment keys in staging without exposing values", () => {
  const original = { ...process.env };
  try {
    Object.assign(process.env, {
      JWT_SECRET: "a".repeat(40),
      REFRESH_TOKEN_SECRET: "b".repeat(40),
      OTP_SECRET: "c".repeat(40),
      ALLOWED_ORIGINS: "https://staging.example.test",
      NODE_ENV: "production",
      APP_ENV: "staging",
      DATABASE_URL: "postgresql://localhost/test",
      RAZORPAY_KEY_ID: "rzp_live_sensitive",
      RAZORPAY_KEY_SECRET: "secret",
    });
    assert.throws(() => runtimeEnv("worker"), /key mode/);
  } finally {
    for (const k of Object.keys(process.env))
      if (!(k in original)) delete process.env[k];
    Object.assign(process.env, original);
  }
});
