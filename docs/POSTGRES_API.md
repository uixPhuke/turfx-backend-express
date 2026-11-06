# PLAYZA PostgreSQL API

This is a separately runnable API backed by the new PostgreSQL schema. It does not replace or redirect the existing MongoDB `/api/v1` API.

## Run locally

From the backend directory, configure the environment variables documented in `.env.example`. Set `DATABASE_URL` to a dedicated development database, use three distinct random secrets of at least 32 characters (`JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `OTP_SECRET`), and configure SMTP credentials for verification/reset mail.

```sh
npm run db:generate
npm run db:migrate:deploy
npm run start:postgres
```

The new API defaults to port 8001; `POSTGRES_API_PORT` overrides it. Its route prefix is `/api/v2`. Starting the server does not seed users, sports, venues or prices and does not import legacy data. Apply migrations only to an intentionally selected target database. The original API still starts with `npm start`.

## Implemented routes

| Method | Path relative to `/api/v2` | Behavior |
|---|---|---|
| GET | `/health` | Runs a PostgreSQL query before reporting healthy |
| POST | `/auth/register` | Creates an unverified customer and sends an email code |
| POST | `/auth/request-code` | Requests EMAIL_VERIFICATION or PASSWORD_RESET; generic eligibility response |
| POST | `/auth/verify-email` | Atomically consumes an email verification code |
| POST | `/auth/login` | Creates a device session and returns access/refresh tokens |
| POST | `/auth/refresh` | Rotates a hashed refresh token; reuse revokes its session/family |
| GET | `/auth/me` | Returns the current safe user profile |
| POST | `/auth/logout` | Revokes the authenticated session immediately |
| POST | `/auth/reset-password` | Consumes a reset code, changes the password and revokes all sessions |
| GET | `/sports` | Reads active sports from the database |
| GET | `/venues` | Paginates approved venues; optional search and sportId filters |
| GET | `/venues/:id` | Returns approved venue/facility/resource/sport information |
| POST | `/bookings` | Creates a server-priced exclusive or capacity reservation hold |
| GET | `/bookings` | Lists only the authenticated customer's bookings |
| GET | `/bookings/:id` | Returns only an owned booking; other customers receive 404 |
| POST | `/bookings/:id/cancel` | Cancels an unpaid hold and atomically releases its allocation |

Authenticated routes require `Authorization: Bearer <accessToken>`. Registration accepts `name`, `email`, `password` and optional E.164 `phone`; privilege fields are rejected. Passwords must be at least 12 characters and at most 72 UTF-8 bytes. Passwords are never trimmed or HTML-sanitized. Login accepts optional `device` metadata.

Verification takes `email` and six-digit `code`. Reset takes `email`, `code` and the new `password`. Challenges expire after 10 minutes, allow five attempts and are stored as secret-keyed digests. Access tokens last 15 minutes; sessions/refresh tokens last at most seven days. Only hashed refresh tokens are persisted. Clients must replace the stored refresh token after every refresh. Session state, account state, issuer, audience and token purpose are checked on authenticated requests.

For venue/booking pagination, `page` begins at 1 and `limit` is at most 50. All dates in booking requests must be ISO timestamps with an explicit timezone/UTC offset. IDs use UUIDs, not MongoDB ObjectIds. Venue responses currently retain the schema's relation names (`facility_venue`, `resource_facility`, etc.); a stable mobile DTO layer remains to be finalized before client integration.

## Reservation contract

```http
POST /api/v2/bookings
Authorization: Bearer <accessToken>
Idempotency-Key: <8-to-160-character-request-key>
Content-Type: application/json
```

```json
{
  "resourceId": "<resource UUID>",
  "sportId": "<sport UUID>",
  "startsAt": "2026-12-10T10:00:00+05:30",
  "endsAt": "2026-12-10T11:00:00+05:30",
  "participants": 4
}
```

The server validates customer verification, active/approved resource hierarchy, offered sport, participant limits, duration, local operating hours and availability exceptions. It selects a configured pricing rule; no price fields are accepted from the client. Exclusive prices are per resource interval; capacity prices are per participant per interval. Monetary values are integer minor units with explicit currency. Price snapshots preserve the selected rule and sport.

Exclusive overlaps are rejected by a PostgreSQL exclusion constraint. Capacity requests update the session's reserved count with a guarded transactional update. Booking and outbox event creation occur in the same transaction. Repeating an identical request/key returns its original booking; changing the request with that key returns 409. Idempotency keys are scoped to the authenticated customer at the HTTP boundary.

Holds expire after 15 minutes. The standalone PostgreSQL server sweeps due holds every 30 seconds and releases allocations transactionally. Cancellation currently supports unpaid holds only; paid cancellation/refunds require the future PostgreSQL finance module. No payment is implied by a HELD booking.

Capacity sessions cannot overlap for the same resource and cannot exceed resource capacity. Database triggers enforce consistent booking/session/resource and reservation/origin relationships. The original migrations remain unchanged; the added integrity migration is forward-only.

## Validation and current limits

Run `npm run typecheck`, `npm run lint`, `npm test -- --runInBand --silent` and `npm run db:validate`.

`npm run test:postgres` additionally runs actual PostgreSQL HTTP and concurrency tests. It requires `PLAYZA_TEST_DATABASE_URL` pointing to the deliberately isolated loopback test instance on port 55439. Tests create synthetic fixtures; they never truncate application tables or read legacy environment credentials. CI provisions its own PostgreSQL service.

The tested new flows are auth/session/challenge lifecycle, approved venue discovery, resource reservation, cancellation, expiry, authorization isolation and database constraints. SMTP delivery is injected in tests; real email delivery is not attested by those results.

Implemented modules now also include scoped owner onboarding and resource configuration, availability and multi-window quotes, Razorpay orders/capture/signed webhooks/bounded refunds and late-capture refund processing, customer profile/favourites/notifications, authenticated media uploads, teams/invitations/games, persisted messages and Socket.IO membership enforcement. Production rate limits use Redis and Socket.IO uses its Redis adapter when configured. The separate worker expires holds, delivers database notifications and reconciles known pending refunds/late captures.

Remaining: complete edit/moderation/organizer workflows; customer cancellation/refund policy; taxes/fees/coupons; ambiguous order recovery; wallet payouts; actual provider sandbox verification; push delivery; legacy migration/backfill rehearsal and production cutover. Test doubles validate provider contracts but do not prove live external integration.

## Additional routes

- `PATCH /account`, `GET /account/roles`, `POST /account/avatar`
- `GET /favourites`, `PUT|DELETE /favourites/:venueId`
- `GET /notifications`, `POST /notifications/:id/read`
- `GET /resources/:id/availability?date=YYYY-MM-DD&participants=2`
- `POST /payments/orders`, `POST /payments/verify`, `POST /payments/webhook`, `GET /payments`
- `POST /admin/payments/:id/refund`
- `/owner/applications`, `/owner/venues`, `/owner/facilities`, `/owner/resources`, resource hours/prices and shared sessions
- `POST /owner/venues/:id/media`, `DELETE /owner/venues/:id/media/:mediaId`
- `/admin/applications`, `/admin/venues`, reviews, sports and analytics
- `/teams`, team invites, `/invitations`, invitation responses
- `/games`, join requests and organizer acceptance
- `/conversations`, messages and read markers

Socket events: `conversation:join`, `message:send`, `message:new` and typing. Every room join/send validates the current session and membership. Uploaded image files are limited to 8 MB and accepted JPEG/PNG/WebP signatures; the provider decodes and transforms actual files. All owner/admin permissions are checked on the backend.
