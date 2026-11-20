# PLAYZA delivery plan — updated 17 November 2026

Current release assessment: **local Docker is operational; free hosted staging is being prepared. Paid hosting is deferred by owner choice. Production is not cleared.** No new product features were added during release validation.

## Product phases

| Phase | Implementation state | Outstanding release work |
|---|---|---|
| 1 — Backend audit | Completed | Retain findings and trace changes |
| 2 — Architecture/database | Shared PostgreSQL/Prisma model and six migrations implemented; three-application boundaries accepted | Actual reconciled MongoDB data import/cutover; dashboard contract review |
| 3 — Foundation | Implemented and locally/CI verified | Hosted operational configuration |
| 4 — Core backend | Implemented | End-to-end hosted QA |
| 5 — Booking/payments | Local consistency, signatures, idempotency/refund tests pass | Actual capture/refund/webhook delivery |
| 6 — Customer mobile | Connected Expo app; prior internal Android/iOS simulator builds recorded | Updated signed release builds, push/maps configuration and physical-device/store QA |
| 7 — Community | Local chat/membership/persistence tests pass | Hosted multi-instance reconnect and device lifecycle QA |
| 8 — Business/deployment | API operations and transitional Expo owner/admin tools exist; deployment configuration prepared | Dedicated Next.js owner dashboard and separate Next.js admin dashboard not yet implemented; web auth/permissions QA, hosted validation and production rollout |

## Accepted application delivery boundaries — 17 November 2026

[APPLICATION_ARCHITECTURE.md](APPLICATION_ARCHITECTURE.md) is the accepted application architecture. Customer: one React Native + Expo application for iOS and Android. Owner: dedicated responsive Next.js dashboard. Admin: separate restricted Next.js dashboard. All three use the existing API, shared PostgreSQL database and backend business logic. Shared identities support CUSTOMER+OWNER; owner approval and venue-level staff permissions remain backend-controlled. Future owner mode extends the existing Expo app; no separate owner mobile application initially.

Reviewed: Prisma UserRole/OwnerApplication/VenueMember, identity/session service, owner approval and scoped management/staff/analytics routes, Expo session/profile/business/admin clients. The two Next.js projects are not implemented. Existing business/admin screens are transitional functionality, not completed dedicated dashboards. Owner booking totals are not verified net revenue/settlements.

| Work item | State | Dependency / completion evidence required |
|---|---|---|
| Architecture decision and compatibility policy | Accepted/documented | Documentation-only; no runtime changes |
| Owner/admin endpoint and permission inventory | Required next | Verify each requested operation; STAFF is not automatically authorized by enum presence |
| Responsive owner Next.js dashboard | Planned | Shared API/auth, owner verification states, active venue membership, operations and accurate revenue semantics |
| Separate admin Next.js dashboard | Planned | Restricted access, API role enforcement, privileged-flow tests |
| Browser session security | Planned | Server-side forwarding, Secure HttpOnly host-only cookies, CSRF/origin checks, serialized refresh, private-cache isolation |
| Dashboard release validation | Not performed | Responsive QA, combined CUSTOMER+OWNER and staff cases, cross-venue/non-admin denial, staging CI/deploy evidence |
| Transition from embedded Expo tools | Deferred | Web parity and validated release; preserve routes/deep links until then |
| Owner mode in existing Expo app | Future | Reuse shared API/permissions after web priorities; no separate mobile app |

Implement in that order while retaining the existing backend/mobile and free/local-first infrastructure. Do not rewrite auth/booking, create dashboard databases, migrate production data, or provision paid infrastructure for this documentation update. Existing payment/device/hosting/cutover release gates remain open; architecture acceptance does not mark Phase 8 complete.

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
2. Mobile points to the verified Docker LAN API through explicit local EAS profiles. First Android development/preview native builds failed on unused MMKV requiring Nitro; unused MMKV removed and both corrected signed Android builds FINISHED; both artifact endpoints verified HTTP200 on 17 November. Apple signing/profiles, FCM/APNs and restricted Maps credentials remain unavailable.
3. Razorpay sandbox checkout was attempted but provider verification returned one failed and one created attempt, zero captured. Synthetic booking was cancelled. Actual capture/refund/webhook success is not claimed.
4. Physical-device QA, managed monitoring/alert delivery, production-sized load/recovery and real legacy-data reconciliation remain release gates.

See STAGING_VALIDATION.md and docs/evidence/staging-2026-11-14.json for evidence and resource/run identifiers. No production deployment, live charge, store submission or legacy cutover has occurred.

## Free/local-first direction — 15 November 2026

Owner declined Render billing. Paid provisioning is deferred, not a development blocker. Complete Docker stack and explicit LAN-capable mobile/EAS local profiles are being validated. Free Render supports a limited temporary API/datastore demonstration but lacks a worker, blocks SMTP and expires PostgreSQL. See FREE_LOCAL_TESTING.md; production configuration remains intact. No paid infrastructure is authorized for this stage.

Supabase follow-up: dedicated Free PostgreSQL project provisioned at quoted $0/month. No API deployment or Prisma migration is claimed. btree_gist 1.7 in extensions, a temporary GiST constraint, and denial of public-schema access to Supabase API roles verified. See SUPABASE_FREE_STAGING.md. First EAS native builds exposed an unused MMKV/Nitro linkage error; MMKV was removed, mobile verify and Expo dependency checks pass, corrected preview/development builds FINISHED. Razorpay direct authorization API returned HTTP400 BAD_REQUEST_ERROR (requested URL unavailable), although test-order creation succeeds.

PostgreSQL17 compatibility rehearsal (15 November): all six existing Prisma migrations applied through the existing migration Docker image to a disposable PG17 database with btree_gist in extensions. Both resource_no_overlap and capacity_sessions_no_overlap constraints were present; six finished migration records verified. Test container removed. This is local version-compatibility evidence, not managed Supabase migration/TLS verification.

The existing PostgreSQL integration suite also passed on a second disposable PG17 container: 48 passed, zero failures/skips; providers mocked. Container removed. This adds PG17 evidence without replacing the separate requirements for real checkout/webhook/device QA.

17 November: Docker and local web restored after desktop downtime; read-only API/LAN/web/CORS checks pass. Android development and preview artifacts both downloadable (HTTP200). Supabase project ACTIVE_HEALTHY with zero security lints; database connection file still absent. iOS simulator-local native build FINISHED without Apple distribution signing.

17 November iOS native result: simulator-local build ec6a99fa-49ca-4975-948c-41dc106bca66 FINISHED successfully. Build page: https://expo.dev/accounts/uixphuke/projects/playza/builds/ec6a99fa-49ca-4975-948c-41dc106bca66 . This is a simulator archive, not a signed physical-device IPA or App Store submission. Xcode/Simulator is absent locally; runtime QA remains unperformed. With Xcode installed, use `npx eas-cli build:run --platform ios --latest` to install the simulator build.

The consolidated current release record is RELEASE_VALIDATION_2026-11-17.md, including completed native builds, fresh audit snapshots and remaining external requirements.


## Reference UI implementation — 17 November 2026

Customer home, venue details, slot calendar, payment summary/ticket, timeline, chats/invites, profile and nearby map were rebuilt around the supplied phone interiors. Shared responsive components preserve the lime/stone/ink palette and actual API behavior. Public venue discovery now returns safe hourly-price, rating and booking-count summaries, verified by the existing PostgreSQL suite (48 passed). No schema migration was introduced.

Local UI QA exercised sign-in, selection/availability, a synthetic hold and cancellation, authenticated synthetic QR ticket, day filtering, favorites, chat search/invites, support and live keyless maps. Browser findings corrected: nested buttons, empty text children, cancelled Upcoming entries, venue/device date mismatch and narrow booking-price padding. Mobile variant/type/lint checks and final Android/iOS/web bundle exports passed. Backend Prisma/type/lint checks passed; schema validation used a placeholder URL, not a managed database connection.

Full visual/native release sign-off remains open: keyless OSM map differs from the custom illustrated reference; exact portraits/individual venue assets are unavailable; real privacy policy URL and native Maps configuration/device QA remain required. See mobile `design-qa.md` and `docs/ui-qa/` for evidence and severity. Earlier signed binaries and CI builds predate the redesign; no new signed build, deployment, payment capture/refund or store submission is claimed. UI changes remain in the working codebase, with no commit/push in this continuation.


## Owner gallery update — 18 November 2026

Multiple photo selection, per-photo results/retry, saved previews, cover/reordering and confirmed removal are implemented in the existing Expo management flow against the shared API. Gallery limit20 is enforced transactionally; no migration was added. Owner venue responses include ordered public photo metadata and PATCH `/owner/venues/:id/media/order` accepts the complete unique ID list. See [OWNER_PHOTO_MANAGEMENT.md](OWNER_PHOTO_MANAGEMENT.md) for limits, permissions, actual Cloudinary results, the 50-test PostgreSQL run and device/timeout limitations. This does not mark the planned Next.js dashboards or full owner platform release complete.

## UX clarity and nearby discovery — 18 November 2026

Implemented compact labeled owner/chat actions, standard secondary buttons, detailed wishlist and notification cards, permission-driven nearby discovery and real-map centering. Preserved existing Razorpay Standard Checkout for eligible UPI Intent / desktop QR and server verification. Local PostgreSQL regression suite now 52/52; mobile checks include five photo and three location tests. See [UX clarity validation](UX_CLARITY_2026_11_18.md) for exact scope and remaining physical-device/provider checks. No staging/production readiness claim is added.

19 November follow-through: final mobile verify and Android/iOS/web bundle export passed; restored local Docker stack healthy with worker running. Location in-flight logout/session-expiry privacy edge case fixed and regression tested. New signed binaries and physical-device/provider validation remain outstanding.

## Compact secondary actions and chat — 19 November 2026

Secondary controls now use content width and icon/text actions; primary sign-in/save/booking styling is preserved. Profile photo, team members/invites and owner applications have explicit compact actions and focused forms. Chat now has dated bubbles, a keyboard-aware bottom composer and separate message options. Mobile verify and final TypeScript/ESLint passed. Browser320px checks covered forms, per-team invite state and send/reopen in a single-member local synthetic QA team. See docs/COMPACT_ACTIONS_AND_CHAT.md; native keyboard/device certification is still pending.

## Group-chat journey and UI clarity — 20 November 2026

Implemented dedicated New group and Invite members screens, create-to-chat navigation, group-header info navigation, readable member/admin rows and confirmed member actions; removed inline group forms and self-demotion. Reviewed access-aware business shortcuts, staff role selection, game cancel/leave confirmation, connection messaging and monetary precision. Mobile verify passes with10 upload/location/money tests. Detailed actual verification and untested native/multi-account paths: docs/GROUP_CHAT_UX.md. No blanket production/physical-device certification.

Android/iOS/web bundle export succeeded20 November: `/private/tmp/playza-groups-ux-final-1120`. These are bundle/static outputs, not signed APK/IPA releases. API, PostgreSQL and Redis healthy; worker running. UI changes remain local.

## UPI/QR checkout preparation — 21 November 2026

Implemented clear payment-method descriptions, INR UPI-priority checkout configuration, test/live flow separation and required iOS UPI discovery schemes.14 mobile tests/type/lint/variant checks pass. Actual Razorpay test checkout opened20 November; only cards/netbanking/wallet appeared, so live UPI/QR remains unverified and merchant/device enablement is still required. No payment submitted or live keys used. See docs/UPI_AND_QR_PAYMENTS.md.

## GitHub publication — 21 November 2026

The mobile UI/group/payment update was pushed to the existing `playza-staging-20261106` branch as [9c403c0](https://github.com/uixPhuke/playza-mobile/commit/9c403c0). Isolated mobile publication verification passed with14 tests, TypeScript, ESLint and variant checks; final Android/iOS/web export passed. No fresh dependency install or newly signed native binary is implied.

The backend publication snapshot passes Prisma validation, TypeScript and ESLint, plus52/52 PostgreSQL regression tests (zero failed/skipped) after all existing migrations on a fresh disposable database. This supersedes the older test dates for the gallery/discovery/notification changes included here. Publication includes reusable gallery endpoints, public venue metadata, nearby discovery, wishlist details and authorized notification context required by the mobile client. No database/schema migration was added and no live service was deployed.

UPI/QR live enablement and device payment validation remain external release work; the actual test checkout opened but UPI/QR was not exposed. See UPI_AND_QR_PAYMENTS.md. No production-readiness claim is added by a Git push.

### Direct payment selection — 21 November 2026

Mobile checkout now exposes PhonePe, Google Pay, Paytm UPI, QR, cards and other methods as selectable rows, preserving the main PLAYZA CTA. Each choice maps to its own Razorpay instrument preference; non-INR bookings exclude UPI. Local verify: 15 tests plus type/lint/variant checks pass. Browser selection and radio accessibility verified at phone width. Merchant-enabled UPI/QR, native app switching and end-to-end real payments remain external requirements; no new payment submitted.
