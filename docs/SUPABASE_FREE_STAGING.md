# Optional Supabase Free PostgreSQL staging

Status: dedicated free project provisioned and management SQL verified on 15 November 2026. Project `kebshsbehrajlrooykxn`, PLAYZA Staging, region ap-south-1, organization uixPhuke's Org. Organization plan Free; actual quoted cost $0/month. Existing Nexora project untouched. No paid upgrades or data imports were performed. Direct Prisma/password/TLS connectivity and hosted API remain unverified.

## Architecture

Keep the complete Docker PostgreSQL/Redis/API/worker environment as the default. Supabase can replace the PostgreSQL host for a separate staging environment; it does not run this Express API, BullMQ worker or Redis. Keep PLAYZA JWT authentication and Prisma. Do not add Supabase Auth or connect the mobile app directly to database tables.

`render.supabase.free.yaml` prepares an optional free Render API plus free Redis with an externally supplied Supabase DATABASE_URL. It creates no Render PostgreSQL or worker. This is separate from the previously reviewed Render-only plan and has not been planned/applied remotely. Render API sleep/SMTP restrictions and the missing hosted worker still apply. Do not point the existing Docker stack at Supabase: use separate staging secrets/processes to prevent accidental cross-environment jobs.

## Free-tier constraints

As checked against official documentation on 15 November 2026, Supabase Free allows two active free projects and 500 MB database storage per project on shared resources. Low-activity projects may pause after seven days. Included bandwidth/storage/compute limits apply; inspect actual account quota before creation. Do not upgrade, enable paid IPv4, buy capacity, or generate artificial keepalive activity. This is temporary test hosting, without a production availability or recovery guarantee.

Use encrypted off-platform logical backups; do not rely on paid point-in-time recovery or assume managed backup downloads are included. A local worker is available only while its computer/network runs. A free database alone does not make payments, email, push or chat end-to-end verified.

## Provisioning and security sequence

1. Connect the owner's Supabase account and inspect organizations/free project usage. Create a dedicated free PLAYZA staging project in a suitable available region, without changing existing projects or billing.
2. Generate a unique database password and store it only in a private secret store; never commit it or pass credentials in command arguments.
3. **Restrict Supabase Data API access before applying PLAYZA migrations**, because existing migrations create tables in `public` without Supabase RLS policies. Provider-specific hardening in `infrastructure/supabase/backend-only-access.sql` has been applied to this empty project as `playza_backend_only_access`: public-schema usage revoked for PUBLIC/anon/authenticated/service_role; future postgres-owned table/sequence/function grants restricted. SQL verification confirms all three API roles lack public-schema usage while postgres retains it. Disable the unused Data API in dashboard settings as an additional control when dashboard configuration is available. Also keep GraphQL/database API exposure disabled for PLAYZA tables. Dashboard-default grants must not expose sessions, private messages, users or payment records. Do not enable browser database access later without a separate grants/RLS review.
4. Use the dashboard's exact **IPv4 session pooler** connection string (port 5432). Direct database hosts normally need IPv6 or a paid IPv4 add-on; do not purchase that add-on. Session mode supports the current long-lived Prisma processes, migrations and administrative sessions. Do not use transaction mode port 6543 for migration/backup commands.
5. Set backend-only `DATABASE_URL`, URL-encoding the password and retaining TLS: `postgresql://postgres.PROJECT_REF:URL_ENCODED_PASSWORD@POOLER_HOST:5432/postgres?sslmode=require&connection_limit=3&pool_timeout=10&connect_timeout=10`. This is a placeholder; get the actual host from the project. Do not put it in EXPO_PUBLIC_* variables. API and worker each have a pool: account for their combined connections plus migration/backup sessions.
6. Run `npm run db:migrate:deploy` once against the empty dedicated staging project. Use the existing migrations, not `db push`, reset or a new baseline. Confirm btree_gist installation and both GiST exclusion constraints; the extension is essential to booking overlap protection. Managed permissions/extension compatibility remain unverified until execution.
7. Run `npx prisma migrate status`, verify readiness, run staged authorization/booking-concurrency tests using synthetic data, and confirm Data API cannot access PLAYZA tables. Do not run destructive local integration suites against a shared project.
8. Apply a separate, reviewed deployment plan only when actual database credentials and exact HTTPS browser origins are available. Configure providers in test mode. Register a reachable HTTPS Razorpay webhook separately.
9. Use the existing `scripts/database-backup.sh` and recovery procedure with the session/direct URL, PG client version at least the server version, and a dedicated encrypted backup directory. Restrict logical backup to PLAYZA-owned objects when using a managed Supabase database; do not restore Supabase system schemas/roles into another project. Rehearse restore into an isolated local PostgreSQL instance and verify counts/constraints before claiming recovery readiness.

Production configuration and existing local data remain unchanged. Existing Prisma pools already support URL connection_limit overrides; no Prisma schema or dependency migration is necessary merely to change the PostgreSQL host.

## Verification record

| Item | Status |
|---|---|
| Official free limits and Prisma connectivity approach | Reviewed |
| External-database/free-API Blueprint | Prepared locally |
| Supabase account/project | Connected; dedicated Free project ACTIVE_HEALTHY |
| Database password / IPv4 session-pooler URL | Not supplied by connected project-creation tool; Prisma connection pending |
| Public schema API grants | Revoked; anon/authenticated/service_role access false, postgres true |
| btree_gist | Installed 1.7 in extensions; UUID/time-range exclusion probe passed with search_path=public |
| Security advisor after provider hardening | Initial public-extension warning resolved by relocating btree_gist to extensions; repeat check returned zero lints |
| Prisma TLS/database migrations/constraints on Supabase | Not tested; no application tables created |
| Hosted API, worker, Redis and webhook delivery | Not verified |
| Local Docker API/PostgreSQL/Redis/worker | Running; API/PG/Redis healthy |

Sources: [Pricing](https://supabase.com/pricing), [Free database-only project limits](https://supabase.com/kb/faqs/platform/database-only-cost), [Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Prisma](https://supabase.com/docs/guides/database/prisma), [Database connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [Data API security](https://supabase.com/docs/guides/api/securing-your-api).

Obtain/set the project database password through the Supabase dashboard and place the exact session-pooler DATABASE_URL in the backend staging secret store. Do not send it in chat. The connected management tools provide SQL access but do not return a database password or configure Data API settings. Management SQL success is not evidence that Prisma can connect over the pooler. Do not reconstruct Prisma migration bookkeeping through management SQL.

Extension relocation was verified transactionally with a temporary UUID/time-range GiST exclusion constraint under public-only search_path; the temporary table was dropped on commit. This checks managed extension compatibility without creating application tables or claiming Prisma migrations ran.

PostgreSQL17 compatibility rehearsal (15 November): all six existing Prisma migrations applied through the existing migration Docker image to a disposable PG17 database with btree_gist in extensions. Both resource_no_overlap and capacity_sessions_no_overlap constraints were present; six finished migration records verified. Test container removed. This is local version-compatibility evidence, not managed Supabase migration/TLS verification.

The existing PostgreSQL integration suite also passed on a second disposable PG17 container: 48 passed, zero failures/skips; providers mocked. Container removed. This adds PG17 evidence without replacing the separate requirements for real checkout/webhook/device QA.

17 November recheck: project remains ACTIVE_HEALTHY and security advisor returns zero lints. The .env.supabase connection file is still absent; no Prisma migrations or data import were attempted against the managed project.
