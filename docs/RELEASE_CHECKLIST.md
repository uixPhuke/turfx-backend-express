# Release checklist

## Local engineering gates

- [ ] Clean source snapshot reviewed; no `.env`, service-account private keys or signing material in Git/artifacts.
- [ ] Backend verify, 93 legacy regressions and PostgreSQL integration suite pass.
- [ ] Fresh database migrations, schema diff and backup/restore rehearsal pass.
- [ ] Container builds in CI; non-root runtime starts, readiness detects DB/Redis failure and SIGTERM drains.
- [ ] Mobile TypeScript/lint, SDK dependency validation, Expo Doctor and all-platform bundles pass.
- [ ] npm advisories reviewed; incompatible upgrades are explicit release risks, not hidden by audit exclusions.

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
