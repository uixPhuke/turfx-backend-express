# PLAYZA release validation — 17 November 2026

Assessment: complete local Docker environment restored and verified, Android internal builds available, iOS simulator native build successful. Supabase Free database provisioned and secured, but hosted application staging and production release are not cleared. No paid hosting, Apple membership purchase, production deployment or real-data cutover was performed.

## Actual results

| Area | Evidence and scope |
|---|---|
| Docker | Cached API, worker and migration image builds passed today. PostgreSQL/Redis/API healthy; worker running; existing data preserved. |
| API | Local live/ready/sports and LAN readiness HTTP 200; security headers present; untrusted Origin receives no CORS access. |
| Local web | http://localhost:8081 returns 200. Login/register/reset navigation rendered in browser. No authenticated flow, email delivery or device QA claimed. |
| PostgreSQL compatibility | On 15 November, six migrations and 48 integration tests passed against disposable PostgreSQL 17, with btree_gist in extensions and both overlap constraints verified. Test containers removed. |
| Earlier regressions | Previous evidence: 93 legacy tests, 3 runtime tests, PostgreSQL 18 tests and isolated Docker backup/restore passed. They were not all rerun today. |
| Backend/mobile checks | Backend schema/type/lint passed on 15 November. Mobile seven-profile transport guards, typecheck and lint passed today; Expo Doctor 18/18 passed on 15 November. |
| npm advisories | Today, registry.npmjs.org reports zero advisories for backend production, backend full and mobile lockfile trees. Raw snapshots and lockfile hashes retained. |
| Git history secrets | Gitleaks 8.30.1: backend 94 scanned commits, one confirmed deployment-prose false positive; mobile 16 scanned commits, no findings. No confirmed credentials detected in available published staging histories. No broad allowlist or rewritten history. |
| Android development | Build cc6b9562-84eb-40ed-b4d5-7558ba43ce21 FINISHED; APK endpoint 200 today, 224475025 bytes. Requires Metro. |
| Android preview | Build a42f7f30-573b-4455-8380-5e980fcc607e FINISHED; APK endpoint 200 today, 123702471 bytes. JavaScript bundled; still uses LAN backend. |
| iOS simulator | Build ec6a99fa-49ca-4975-948c-41dc106bca66 FINISHED today; archive endpoint 200, 26802680 bytes. Simulator compilation only; not a signed physical-device IPA. Local Xcode/Simulator absent, so launch QA unperformed. |
| Supabase | Project kebshsbehrajlrooykxn ACTIVE_HEALTHY today; security advisor zero lints. API roles denied public-schema access; btree_gist in extensions verified previously. No application tables migrated or data imported. |
| Razorpay | Test-order creation passed previously. Direct authorization API returned 400 BAD_REQUEST_ERROR on 15 November. Actual checkout/capture/refund/provider webhook delivery not verified. |
| Other providers | Prior Cloudinary upload/transform/delete passed. FCM/APNs, restricted native maps, physical-device uploads/push and lifecycle/reconnection QA remain unverified. |

Builds: [Android development](https://expo.dev/accounts/uixphuke/projects/playza/builds/cc6b9562-84eb-40ed-b4d5-7558ba43ce21), [Android preview](https://expo.dev/accounts/uixphuke/projects/playza/builds/a42f7f30-573b-4455-8380-5e980fcc607e), [iOS simulator](https://expo.dev/accounts/uixphuke/projects/playza/builds/ec6a99fa-49ca-4975-948c-41dc106bca66).

## Immediate testing

Docker Desktop must be running. In turfx: `PLAYZA_BIND_HOST=0.0.0.0 npm run local:up`. Status: `npm run local:status`; stop without deleting data: `npm run local:stop`.

Current phone API: http://10.6.85.212:18121/api/v2. Use the same reachable LAN and keep the computer running. The preview APK embeds this address; rebuild after address changes. Local HTTP is intentionally prohibited in production profiles. Do not forward the API/database/Redis through the router.

Install Android preview through its build page for standalone local testing, or install development and run Metro. For iOS Simulator, install Xcode first, then use `npx eas-cli build:run --platform ios --latest`. Simulator does not require Apple distribution signing; physical iOS builds do. See [Expo guidance](https://docs.expo.dev/build-reference/simulators/).

## Remaining external requirements

1. Place the exact Supabase IPv4 session-pooler DATABASE_URL (port 5432, TLS required, URL-encoded database password) in private ignored turfx/.env.supabase. It is still absent. Do not paste secrets into chat. Then Prisma migrations, connectivity and managed backup/restore can be verified using the intended migration path.
2. Hosted API/Redis/worker/email execution must be configured separately. Supabase hosts PostgreSQL, not this Express/Socket.IO process or worker. Free Render alternative is prepared, not applied; API sleep, blocked SMTP and no free hosted worker remain limitations.
3. Complete real Razorpay test checkout, capture, webhooks and refunds using a reachable HTTPS callback. Synthetic signature tests are not provider-delivery evidence.
4. Physical Android/iOS QA, FCM/APNs credentials, native maps restrictions, Apple distribution account/profiles and store access remain required for release.
5. Managed backup/recovery, hosted monitoring/alerts, production load validation and actual MongoDB reconciliation/cutover remain production gates.

Source: mobile staging commits fcb7454 (unused MMKV fix) and ef28cef (simulator profile). EAS uploaded working-directory archives, so dashboard Git-base metadata differs from subsequently published staging commits. Evidence: evidence/local-free-2026-11-15.json, current npm snapshots and prior staging reports. Local/test results are not production verification.
