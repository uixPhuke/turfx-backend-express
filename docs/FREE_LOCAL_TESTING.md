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

Render's corrected free-only plan was accepted: Blueprint exs-dbsp9rec6qcc739pphp0, sync exe-dbspaa67bikc73c3nq1g. Planned resources: playza-staging-api-a5e2, playza-staging-postgres-a5e2, playza-staging-redis-a5e2, all free. No resources have been applied. Review URL: https://dashboard.render.com/blueprint/exs-dbsp9rec6qcc739pphp0/sync/exe-dbspaa67bikc73c3nq1g . Manual provider secrets and exact browser origins remain required before startup; provider webhook registration remains separate.

Current local LAN endpoint is http://10.6.85.212:18121/api/v2 (15 November; update after network changes). LAN readiness returned 200. Android without a configured native Maps key uses the existing venue-list/external-map fallback rather than attempting an unconfigured native map.

Supabase Free is also authorized as an optional separate staging PostgreSQL host. See SUPABASE_FREE_STAGING.md and render.supabase.free.yaml. Account access and management SQL are verified; Prisma database credentials and end-to-end verification remain pending; Docker remains the default complete environment. This alternative does not imply approval to apply the earlier Render-only plan.

Read-only Docker smoke checks on 15 November: /live, /ready and /sports each returned200 with nosniff headers; an untrusted Origin received no Access-Control-Allow-Origin. Metro/web at http://localhost:8081 returned200. Web logs note push-token listeners are unsupported on web; this is not push-delivery verification.

## Android installation and pending device QA

The corrected development-local build cc6b9562-84eb-40ed-b4d5-7558ba43ce21 finished successfully. EAS artifact HEAD returned200, 224475025 bytes (universal development client; not production download-size evidence). Install from https://expo.dev/accounts/uixphuke/projects/playza/builds/cc6b9562-84eb-40ed-b4d5-7558ba43ce21 . It requires Metro. Preview-local bundles JavaScript for standalone internal testing but still requires the LAN backend. Build archives include the MMKV removal; source was subsequently published as mobile staging commit fcb7454. EAS metadata shows the original workspace's base Git commit because working-directory archives are permitted.

Device QA remains unperformed: install on an actual Android phone, confirm same-LAN readiness in its browser, launch the correct PLAYZA staging app, and exercise synthetic login, discovery, booking/test checkout, cancellation, uploads and chat. Push requires working FCM device credentials; a build artifact does not verify notification delivery. No connected physical device, Android adb or iOS signing/provisioning has been verified here.

If the computer's LAN address changes, update both private .env.local and EAS development/preview EXPO_PUBLIC_API_URL. A preview APK embeds its API URL and must be rebuilt after that change; development client JavaScript can be re-served by Metro. Do not change the production EAS environment to local HTTP. Run production commands with PLAYZA_LOCAL_API=0 and APP_VARIANT=production when a local shell has loaded .env.local.

Standalone preview-local build a42f7f30-573b-4455-8380-5e980fcc607e FINISHED successfully: https://expo.dev/accounts/uixphuke/projects/playza/builds/a42f7f30-573b-4455-8380-5e980fcc607e . Both APK endpoints rechecked HTTP200 on17 November; preview123702471 bytes, development224475025 bytes. These are universal internal builds, not production download sizes. Physical-device QA remains pending.

17 November browser UI smoke: login, registration and password-reset screens rendered and navigation returned to login. No email was sent, account created or authenticated flow claimed. Local development UI remains open at http://localhost:8081/login.

iOS simulator: simulator-local extends simulator and opts into the same private-LAN API transport as Android local profiles. Run `eas build --platform ios --profile simulator-local`. It builds for Simulator without Apple distribution credentials, not for physical iPhone installation. Xcode/Simulator is absent on this computer, so launch QA is separate. Submitted build: https://expo.dev/accounts/uixphuke/projects/playza/builds/ec6a99fa-49ca-4975-948c-41dc106bca66 . See Expo simulator guidance: https://docs.expo.dev/build-reference/simulators/ .
