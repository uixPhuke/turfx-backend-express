# PLAYZA PostgreSQL deployment

The `render.yaml` creates a separate API, notification/expiry worker, PostgreSQL 18 database and Redis instance in Oregon. The existing `turfx-backend-express` MongoDB service is not adopted or modified. Datastores allow private network connections only. Production rate limiting uses Redis; chat uses its Socket.IO adapter. Automatic application deploys are disabled until release verification.

## Verified locally

- Backend TypeScript, lint and whitespace checks pass.
- 93 legacy regression tests pass using synthetic MongoDB data.
- 48 PostgreSQL integration tests pass on a disposable PostgreSQL 18 cluster, including concurrent reservations, capacity, authentication revocation, payments/refunds, tenant boundaries and notification outbox delivery.
- Two independent Redis rate-limit stores increment the same atomic counter.
- Expo app typecheck and Android, iOS and web exports of 42 static routes pass, including owner/admin and media-selection screens; re-run for each release.
- Blueprint validates against the current official Render JSON Schema. Workspace-aware CLI validation is pending CLI authentication. The Render plugin is connected to the user-confirmed My Workspace.

## Release steps

1. Validate the complete release source and publish it to the intended Git branch. Render reads remote source, not local edits. Do not push unreviewed pre-existing workspace changes to the live legacy branch.
2. Authenticate the Render CLI and run `render blueprints validate render.yaml --workspace tea-d6p8ib2a214c738queog --output json`.
3. Create a separate Blueprint from the published release branch. Review the actual resource/cost plan before applying it. Do not adopt or replace existing resources.
4. Supply email credentials, Razorpay key pair, webhook secret and allowed web origins through Render secret configuration. Do not put secret values in source. Authentication secrets are generated independently by Render.
5. The API pre-deploy command applies forward migrations only to its new PostgreSQL database. No MongoDB data is copied automatically. Execute the separately reviewed migration/reconciliation plan before any legacy cutover.
6. Register and verify the operator account, then run `PLAYZA_ADMIN_EMAIL=<operator-email> node scripts/bootstrap-admin.cjs` in the deployed service environment. Registration never grants owner or admin roles.
7. Configure Razorpay webhook destination `/api/v2/payments/webhook`, validate signed captured/refund events and complete actual sandbox payment tests. The worker handles late-capture refunds and known pending-refund reconciliation; receipt-based ambiguous order recovery is implemented; actual sandbox verification remains.
8. Verify health, registration email, session rotation, owner approval, venue setup, real availability, payment capture, notification delivery, chat isolation and shutdown. Record actual deploy IDs and URLs; a queued deploy is not successful delivery.
9. Publish the mobile source to its intended repository, configure the production API URL, brand assets, native identifiers, EAS project and signing accounts. Run native device QA and produce signed Android/iOS builds. A web export is not an app-store release.

## Remaining production work

Cancellation policy, order/refund reconciliation, coupons, configurable taxes/fees, game management, staff, reviews, moderation, owner/admin operations and push workers are implemented. Production credentials, provider end-to-end verification, physical-device QA, migration/backfill rehearsal, real push delivery, backup/restore and load testing remain. See DELIVERY_PLAN.md for current evidence and limits. Existing dependency advisories requiring incompatible framework/tool upgrades must be resolved or explicitly assessed before production approval.

No public deployment or native release has been completed yet.

## Release preparation update — 6 November 2026

API and worker are separate Node 22 processes sharing PostgreSQL 18. Redis handles API rate counters and Socket.IO fanout; durable messages, notifications, bookings and payment state live in SQL. Worker handles expiry, outbox, push receipts and payment reconciliation. See ENVIRONMENT_VARIABLES.md for all configuration and INTEGRATIONS.md for evidence by provider.

### Local setup

Backend: `npm ci`, `docker compose -f compose.local.yaml up -d`, copy `.env.example` to a private `.env`, set matching local database credentials and unique auth secrets, then `npm run db:generate`, `npm run db:migrate:deploy`, `npm run start:postgres`. Start worker separately with `npm run start:worker` after compilation. Local environment is APP_ENV=local / NODE_ENV=development. Never use development credentials on a public host.

Container staging rehearsal: create private `.env.release` using ENVIRONMENT_VARIABLES.md, set APP_ENV=staging and Razorpay test credentials, then `docker compose --env-file .env.release -f compose.release.yaml up --build -d`. The migration service must succeed before API/worker start. Do not use `down -v` on valued data. Port 8001 binds loopback; expose it only through a TLS edge. Docker is unavailable on this workstation, so image/Compose execution is a CI/host verification gate.

### Staging and production separation

Use separate Render Blueprints/resources and source release references, databases, Redis instances, provider accounts/keys, EAS environments and domains for staging and production. The committed Blueprint defaults APP_ENV=staging. For production, use a reviewed copy with distinct resource names and APP_ENV=production; never point staging at production stores. Keep NODE_ENV=production in both. Production requires rzp_live_ keys; staging requires rzp_test_ keys. Provider webhook secrets are different per environment. Render workspace is My Workspace (`tea-d6p8ib2a214c738queog`). No resources have been created by this preparation.

Publish the reviewed source first, validate the Blueprint with authenticated Render access, apply migrations as a single pre-deploy job, deploy the same source SHA to API/worker, then run `PLAYZA_SMOKE_URL=https://<staging-api>/api/v2 node scripts/staging-smoke.cjs`. Test actual provider and device workflows from RELEASE_CHECKLIST.md before production.

### Health, monitoring and scaling

`/api/v2/live` is dependency-free liveness; `/api/v2/ready` and `/health` query PostgreSQL and Redis (when configured), return 503 on drain/failure and bound readiness response wait to two seconds. Readiness probes bypass global rate limits. HTTP request logs contain request ID, route pattern, status and elapsed time; never request body, Authorization, query string or user email. Fatal process errors terminate after bounded drain so the platform can restart; they do not continue an unknown process state. Capture stdout/stderr centrally and configure external uptime, 5xx/p95, restart, DB storage/connection, Redis memory and worker-failure alerts. The provided configuration does not provision a paid error-tracking account or alert recipient.

Start with one API and one worker and measured pool sizing. For multiple API replicas, Redis adapter is required. Socket.IO long-polling needs sticky routing across replicas; otherwise explicitly use tested websocket-only clients. Reconnect must reauthenticate and rejoin conversations. Do not scale based only on Redis availability: run multi-instance lifecycle/load tests first. Watch pending outbox/push/refund age and `/admin/payments/issues` under authorized operator access.

### DNS and TLS

Render provides managed TLS for its service domain. Add owned staging/production API DNS records through the provider dashboard, verify issued certificates and HTTPS before configuring mobile builds. Browser origins must exactly match ALLOWED_ORIGINS (no paths/wildcards). Set TRUST_PROXY_HOPS to actual topology. Optional `infrastructure/Caddyfile` is a self-hosted edge template, not deployed infrastructure: persist Caddy `/data` and `/config`, expose 80/443, set API_DOMAIN, and add that proxy to the Compose network. Database/Redis ports remain private. Verify forwarding-header spoofing cannot bypass limits.

### Mobile builds and signing

Mobile repository: `turfx-native-app/TurfX`. Run `npm ci`, `npm run verify`, `npx expo install --check`, `npx expo-doctor`, then `npx expo export --platform all`. Expo Go cannot validate Razorpay native checkout; use EAS development builds.

Authenticate Expo/EAS, link the actual project UUID, set each EAS environment's EXPO_PUBLIC_API_URL and EXPO_PUBLIC_EAS_PROJECT_ID, Android restricted map key and GOOGLE_SERVICES_JSON file. Development uses `eas build --profile development --platform all`; preview uses `eas build --profile preview --platform all`; simulator uses the simulator profile; production uses `eas build --profile production --platform all`. Install development build and run `npx expo start --dev-client`. Production uses `com.uixphuke.playza` and scheme playza; non-production EAS builds use `com.uixphuke.playza.staging` and playza-staging so they can coexist. No associated domains are claimed without ownership/verification files.

EAS remote credential management is configured, but credentials do not yet exist in verified account state. Android needs a backed-up keystore and Play App Signing/upload access. iOS needs Apple Developer team access, distribution certificate, provisioning profiles and registered devices for internal builds; App Store Connect permissions are separate. Upload FCM v1/APNs credentials through EAS, verify entitlements, then test physical devices. The existing bundle exports are unsigned JS/Hermes compilation checks, not Android Gradle or iOS Xcode release builds. Store signing/build/submission remains blocked on account access.

### Rollback

Record source SHA/image digest and previous healthy release before deployment. If readiness/error-rate/payment checks regress, stop rollout and revert API/worker together to the previous compatible release; leave additive schema migrations intact. Stop workers when investigating duplicate external side effects. Do not down-migrate financial data. Restore to a new database only when application rollback cannot recover; reconcile provider events and bookings before routing writes. See DATABASE_MIGRATION.md and BACKUP_AND_RECOVERY.md.
