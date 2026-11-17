# Release checklist

## Local engineering gates

- [ ] Clean source snapshot reviewed; no `.env`, service-account private keys or signing material in Git/artifacts.
- [ ] Backend verify, 93 legacy regressions and PostgreSQL integration suite pass.
- [ ] Fresh database migrations, schema diff and backup/restore rehearsal pass.
- [ ] Container builds in CI; non-root runtime starts, readiness detects DB/Redis failure and SIGTERM drains.
- [ ] Mobile TypeScript/lint, SDK dependency validation, Expo Doctor and all-platform bundles pass.
- [x] npm known-advisory review refreshed17 November: backend production/full and mobile report zero; raw snapshots retained. Application security and historical-secret scans remain separate.

## Staging gates

- [ ] Independent PostgreSQL/Redis/media/provider credentials and HTTPS domain; NODE_ENV=production, APP_ENV=staging.
- [ ] CI run from published source is green; same release SHA for API/worker, migrations run once.
- [ ] Exact CORS origins/proxy hops verified externally; database and Redis not publicly exposed.
- [ ] Actual Razorpay test order, customer checkout, signature/webhook duplicate/reordering and refund lifecycle verified with recorded IDs.
- [ ] Actual Cloudinary valid/oversized/forged uploads verified; SMTP registration/reset delivered.
- [ ] EAS project linked; Android FCM v1 and iOS APNs credentials configured; notification delivery on physical devices verified.
- [ ] Preview APK and signed iOS internal build tested; maps restrictions and denied permissions verified.
- [ ] Two-instance Socket.IO reconnect/membership isolation and booking contention/load rehearsed.
- [ ] Uptime/readiness, 5xx/latency, DB connection/storage, Redis memory, worker failure/payment issue alerts reach the operator.
- [ ] Backup restore meets measured RPO/RTO; application rollback rehearsed.

## Production gates

- [ ] APP_ENV=production and separate live Razorpay keys/webhook secret; live-mode account activation confirmed.
- [ ] Operator-approved pricing/tax/cancellation policy; no fixture accounts or synthetic seed data.
- [ ] Domain DNS/TLS, monitoring, on-call owner, incident/rollback runbook and retention configured.
- [ ] App Store Connect / Play Console access, identifiers, signing, privacy policy, support URL, data-safety/privacy disclosures and account deletion process reviewed.
- [ ] Production EAS build uses production API and project; signed AAB/IPA and store review requirements validated.
- [ ] Staging evidence accepted; publish through a controlled rollout with health/error monitoring and rollback threshold.

Unchecked items are release gates, not claims of failure. See DEPLOYMENT_READINESS.md for actual verification evidence.


## Dedicated dashboard gates — architecture accepted 17 November 2026

These are planned release gates, not completed dashboard functionality. See APPLICATION_ARCHITECTURE.md.

- [ ] Dedicated responsive Next.js owner application and separate restricted Next.js admin application build and deploy independently.
- [ ] Both use the existing shared API; neither contains Prisma/database access, duplicate identity storage, booking/pricing engines or payment verification.
- [ ] CUSTOMER+OWNER identities retain customer access; pending/rejected owners cannot manage venues; staff navigation and every operation match active venue permissions.
- [ ] Cross-venue access, inactive membership, non-admin direct URLs/API calls, role changes and revoked sessions are denied server-side.
- [ ] Browser Secure HttpOnly host-only session cookies, origin/CSRF defenses, refresh concurrency, logout and private-cache isolation verified.
- [ ] Owner revenue reporting distinguishes booking totals/currency from capture/refund/settlement evidence.
- [ ] Mobile/desktop responsive QA and API contract/regression checks pass; deployments and real provider tests retain actual evidence.
- [ ] Existing Expo owner/admin tools remain usable until web parity and a tested transition; future owner mode extends the same Expo app.
