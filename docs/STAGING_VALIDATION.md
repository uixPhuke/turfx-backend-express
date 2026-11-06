# Staging deployment and release validation — 6 November 2026

## Current result

Local container staging rehearsal passes. Hosted Render staging is **not deployed**: its first actual plan failed with `need_payment_info` for API, worker, PostgreSQL and Redis. The dashboard confirms **No card on file**. The secure Add Card form is open for the owner; Render requires a temporary $1 authorization. No billing/card details were available to the agent and none were invented. After billing is configured, re-plan and review the actual resource/cost changes before approving.

## Actual linked resources

- Backend staging branch: https://github.com/uixPhuke/turfx-backend-express/tree/playza-staging-20261106 . Main and the running MongoDB service were not modified by publication. Source was copied to an isolated checkout and scanned for credential patterns; `.env` and generated outputs excluded.
- Render Blueprint: `exs-dbmqjeom7kps73c3e85g`, PLAYZA Staging, confirmed My Workspace `tea-d6p8ib2a214c738queog`, file `render.staging.yaml`, auto-sync disabled, create-new mode. Planning failed; no services or paid resources were provisioned.
- Backend hosted CI: https://github.com/uixPhuke/turfx-backend-express/actions/runs/42201833908 — completed successfully for the first published staging snapshot, including container build and regressions. Later documentation/development-tool changes require a new run.
- Mobile repository: https://github.com/uixPhuke/playza-mobile — **private**, staging branch. Hosted CI run https://github.com/uixPhuke/playza-mobile/actions/runs/42203714571 was in progress at this report's initial capture; final result must be checked.
- Actual EAS project: https://expo.dev/accounts/uixphuke/projects/playza , UUID `c57f8d7c-d393-4ca9-9af2-463e77d33cd6`, owner uixphuke. Login succeeded, project linked, icon configured, UUID saved to development/preview environments. No invented API URL was uploaded.
- EAS Android preview keystore generated and held remotely by EAS. No keystore passwords/private keys exported to source.
- iOS credential setup reached Apple Developer account authentication; no Apple credentials/profiles were available. Prompt cancelled safely. No signed Android or iOS binary exists yet. A usable preview build needs the real staging API URL and Android Maps configuration; iOS additionally needs Apple team/profile/device access.

## Container/runtime evidence

Docker Desktop 29.9.2 and Compose 5.6.1 were discovered and started. Runtime and migration images built successfully; the initial npm network reset was retried successfully. The final Compose rehearsal uses project `playza-staging-validation`, new dedicated volumes, loopback API `127.0.0.1:18121`, PostgreSQL 18.6 and Redis 7. Existing local/hosted stores were not adopted.

- Migration job exited 0; six migration records verified.
- API runs as `node`, reports healthy; PostgreSQL/Redis healthy; worker remains running.
- Stopping only the rehearsal Redis makes readiness return 503; restarting it restores readiness 200.
- A real pg_dump/pg_restore inside Compose restored into a new isolated database with all six migration records. This is a synthetic schema/fixture rehearsal, not a production-volume RTO benchmark.
- One idle sample: API ~59MiB and worker ~60MiB; these are instantaneous observations, not memory bounds or sustained load capacity.
- Private Compose secrets reside in `/private/tmp/playza-staging-compose.env` with restricted permissions. They are not published or copied into images. `PLAYZA_ENV_FILE` lets Compose use that path.

## Security advisory resolution

Targeted overrides retain Prisma 6.19 and Expo SDK54 compatibility:

- Effect 3.22.4 and DeepmergeTS 8.0.2 remove Prisma transitive high advisories. Prisma generation/validation and 48 integration tests pass.
- Patched Glob 14.0.4 and Minimatch 11.0.5 remove affected development tooling paths. Swagger remains 6.3.0 with its scoped Glob override; legacy Swagger generation and 93 tests pass.
- image-size 2.0.4 removes its high parser advisories. Metro 0.83's two call sites need the old synchronous default API, so an idempotent postinstall adapter handles buffer and path inputs using the patched named export. It fails closed if the expected upstream line changes. Android/iOS/web exports pass after the adapter.
- Latest backend **production** audit: zero advisories. Full backend tree: five low findings. Mobile tree: fourteen low findings. No high/moderate/critical findings remain. Low findings are propagated from deepmerge 4.3.1; the registry's latest version is still affected by GHSA-gcqx-w48m-w2h4. No untested major SDK migration or false zero-advisory claim was made. Trusted build/config inputs only; review upstream patch availability and record risk disposition before production.

Audit counts are a registry snapshot, not a security certification. Dependency locks and narrow override/Metro compatibility boundaries must be regression-tested on future upgrades.

## Payments and external integrations

A real test-mode Razorpay checkout was opened against the isolated Compose API using a synthetic customer/resource and a server-created INR 100-minor-unit booking/order. Checkout displayed Test Mode. Netbanking attempt was cancelled after remaining pending; the official documented test card also remained at provider authorization. Direct provider API verification returned two attempts: one `failed`, one `created`, **zero captured**. Therefore capture, callback success and refund are **not externally verified**. No live credentials or real charge were used. The temporary harness is outside the repository and is not a product feature.

Actual provider webhook delivery remains untested because no public staging endpoint exists. Local HMAC/idempotency/reconciliation tests are not equivalent to real webhook delivery. The generated Compose webhook secret is only a local test configuration and was not registered in Razorpay Dashboard. Real staging needs a matching dashboard webhook secret and subscribed events, then retry/duplicate/out-of-order validation.

Cloudinary synthetic upload/transform/delete passed in the preceding preparation; SMTP authentication passed, but actual email delivery is still unverified. FCM/APNs credentials and Android restricted Maps key/signing fingerprints are absent; push/maps physical-device results cannot be claimed. Local Socket.IO persistence/session/membership tests pass; two-instance hosted reconnect and real mobile lifecycle QA remain.

## Migration and production gates

Read-only inventory of the configured MongoDB source succeeded and its aggregate/index output is in restricted temporary storage. No documents were exported/imported/deleted. `MONGODB_POSTGRES_CUTOVER.md` defines ID/role/resource mapping, money/timezone rules, reconciliation equations, quarantine, write freeze and rollback. Actual ETL and reconciled business-data import remain separate work.

Production remains blocked on hosted staging deployment and accepted plan, real sandbox payment/refund/webhooks, signed builds/device QA, FCM/APNs/maps setup, external alerts/backup retention/load rehearsal, low advisory disposition and actual legacy data cutover reconciliation.
