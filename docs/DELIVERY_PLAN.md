# PLAYZA delivery plan — 14 November 2026

Current release assessment: **local Docker is operational; free hosted staging is being prepared. Paid hosting is deferred by owner choice. Production is not cleared.** No new product features were added during release validation.

## Product phases

| Phase | Implementation state | Outstanding release work |
|---|---|---|
| 1 — Backend audit | Completed | Retain findings and trace changes |
| 2 — Architecture/database | PostgreSQL/Prisma schema and six migrations implemented | Actual reconciled MongoDB data import/cutover |
| 3 — Foundation | Implemented and locally/CI verified | Hosted operational configuration |
| 4 — Core backend | Implemented | End-to-end hosted QA |
| 5 — Booking/payments | Local consistency, signatures, idempotency/refund tests pass | Actual capture/refund/webhook delivery |
| 6 — Mobile | Connected app and all-platform bundles verified | Signed builds, push/maps credentials and physical-device QA |
| 7 — Community | Local chat/membership/persistence tests pass | Hosted multi-instance reconnect and device lifecycle QA |
| 8 — Business/deployment | Owner/admin tools and deployment configuration prepared | Hosted staging, monitoring, managed backups/load validation and production rollout |

## Release Phase 2 — staging deployment and validation

Completed during validation:

- Isolated backend staging branch published; legacy main/service remain separate. Private mobile repository published.
- Current hosted CI passes: backend **6d83564**, run **43599359528**; mobile **e5a1a07**, run **43599194320**.
- Backend clean installs reproduced on Node22/Linux and host npm. Patched Mongoose 9.12.1 retained; the documented MongoDB/Jest OS adapter is test-only. Disposable MongoDB preparation runs before Jest hook deadlines.
- Mobile Node22/npm11.21.2 installation reproduced, and the same npm version is configured in CI/EAS. All four app variants are asserted; staging identifiers cannot silently resolve to production.
- 93 legacy tests / 14 suites, 48 PostgreSQL tests and 3 runtime tests pass. Schema/type/lint, Expo Doctor 18/18 and Android/iOS/web exports pass.
- Actual Docker production/migration images build; rebuilt isolated Compose API/PG/Redis are healthy and worker runs. Prior isolated Redis outage/recovery and backup/restore rehearsals pass. Managed hosted recovery remains unverified.
- Backend production audit: zero advisories. Remaining low tooling findings are documented; no high/moderate/critical findings are accepted as cleared without scans.
- Actual EAS project linked; correct staging Android keystore/package/fingerprint verified. No private signing material exported.
- Read-only configured-source MongoDB inventory and explicit cutover/reconciliation plan prepared. No import, deletion or cutover performed.

Still blocked or unverified:

1. Paid Render provisioning is deferred. A free API/Postgres/Redis plan validated but has not been applied. Owner authorized Supabase Free: PLAYZA Staging kebshsbehrajlrooykxn is ACTIVE_HEALTHY, management SQL and backend-only public-schema grants verified; Prisma migrations await the database password/session-pooler secret. No payment card is required for local development.
2. Mobile points to the verified Docker LAN API through explicit local EAS profiles. First Android development/preview native builds failed on unused MMKV requiring Nitro; dependency removal and rebuild validation are in progress. Apple signing/profiles, FCM/APNs and restricted Maps credentials remain unavailable.
3. Razorpay sandbox checkout was attempted but provider verification returned one failed and one created attempt, zero captured. Synthetic booking was cancelled. Actual capture/refund/webhook success is not claimed.
4. Physical-device QA, managed monitoring/alert delivery, production-sized load/recovery and real legacy-data reconciliation remain release gates.

See STAGING_VALIDATION.md and docs/evidence/staging-2026-11-14.json for evidence and resource/run identifiers. No production deployment, live charge, store submission or legacy cutover has occurred.

## Free/local-first direction — 15 November 2026

Owner declined Render billing. Paid provisioning is deferred, not a development blocker. Complete Docker stack and explicit LAN-capable mobile/EAS local profiles are being validated. Free Render supports a limited temporary API/datastore demonstration but lacks a worker, blocks SMTP and expires PostgreSQL. See FREE_LOCAL_TESTING.md; production configuration remains intact. No paid infrastructure is authorized for this stage.

Supabase follow-up: dedicated Free PostgreSQL project provisioned at quoted $0/month. No API deployment or Prisma migration is claimed. btree_gist 1.7 in extensions, a temporary GiST constraint, and denial of public-schema access to Supabase API roles verified. See SUPABASE_FREE_STAGING.md. First EAS native builds exposed an unused MMKV/Nitro linkage error; MMKV was removed, mobile verify and Expo dependency checks pass, corrected preview/development builds submitted. Razorpay direct authorization API returned HTTP400 BAD_REQUEST_ERROR (requested URL unavailable), although test-order creation succeeds.
