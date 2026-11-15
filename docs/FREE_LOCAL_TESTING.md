# Free local testing — 15 November 2026

Primary environment is Docker on this computer. No paid hosted resources or payment card are required. Production release configuration remains in compose.release.yaml/render.yaml.

Backend: `PLAYZA_BIND_HOST=0.0.0.0 npm run local:up` builds/runs PostgreSQL, Redis, migrations, API and worker. Default binding without PLAYZA_BIND_HOST is loopback. API port defaults to 18121; override PLAYZA_LOCAL_PORT if needed. `npm run local:status` shows health; `npm run local:stop` stops without deleting data. The local overlay must be combined with compose.release.yaml; use the helper to avoid accidentally starting production settings. It writes ignored .env.docker with private permissions, preserving the existing validation database password. Integration keys are optional locally; only Razorpay test keys are accepted. SQL and Redis stay on the Docker network.

Mobile: the private .env.local points to this computer's LAN API. Phone and computer must share a reachable network, and the computer/Docker must remain running. localhost on a phone refers to the phone, not the computer. Update EXPO_PUBLIC_API_URL after DHCP/network changes. Start Metro with `npx expo start --dev-client --lan`. Browser testing uses `npx expo start --web`. Add the web browser's exact Origin to ALLOWED_ORIGINS in .env.docker if it differs from the configured localhost ports.

Use `eas build --platform android --profile development-local` or `--profile preview-local`. These explicit non-production profiles opt into private-network HTTP; the production variant rejects that flag. EAS environments contain the current private LAN URL, not an invented public endpoint. Builds can use included free EAS quota where available; do not upgrade or purchase credits when quota is exhausted. iOS internal builds still require Apple Developer access/provisioning; no free host removes Apple signing requirements. An iOS simulator build needs a Mac with Xcode installed.

Use synthetic accounts and data on this test LAN. Local HTTP is for development only. Stop LAN exposure when finished, or start the stack without PLAYZA_BIND_HOST. Do not forward the API, PostgreSQL or Redis ports through the internet router.

## Free hosting investigation

Verified reference: https://render.com/docs/free (15 November 2026).

Render supports free web/API, static sites, PostgreSQL and Key Value, but **not a free background worker**. Free web spins down after 15 idle minutes, has cold starts, ephemeral disk, no SSH/one-off jobs/scaling, shared monthly quotas, and blocked SMTP ports. Free PostgreSQL is limited to one per workspace, 1GB, expires after 30 days and has no managed backup guarantee. Free Redis data is not durable; use PostgreSQL for authoritative state. External traffic/usage limits can suspend services without a card. These tiers cannot certify full payment reconciliation, notifications or production reliability. Do not use keep-alive traffic to evade idle restrictions.

A temporary free API + free PG + free Redis can demonstrate discovery/auth/booking while this computer runs the worker against explicitly configured staging databases. That is an incomplete, expiring test environment, not always-on staging. Existing SMTP transport cannot send from Render free; an HTTPS email provider or local email execution is required before registration/reset is externally usable. Never point a local worker at a hosted database accidentally; keep separate explicit credentials.

The paid Blueprint is not being applied. A free plan must contain only `free` resources, no worker or paid backup/storage, and be validated against the account before provisioning. No free hosted deployment is claimed merely from this investigation.

## Integration limits

Razorpay test order creation was verified; prior real checkout authorization stalled, and zero captures/refunds were confirmed. Real webhook delivery requires an externally reachable HTTPS endpoint or an explicitly enabled temporary tunnel. Local signed-event tests are not provider delivery evidence. Cloudinary upload/delete was verified previously. FCM/APNs credentials, Maps key restrictions, signed app runtime tests and physical-device QA remain separate. Core local development proceeds regardless of those gates.

Actual Render free-plan validation rejected preDeployCommand (unsupported on free web). The free-only Blueprint instead runs forward migrations once at startup before accepting traffic; this is for a single-instance expiring demo only. Production retains its separate pre-deploy migration job.
