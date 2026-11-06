# Database migration procedure

Target: PostgreSQL 18 and Prisma 6.19.0. Six ordered immutable migrations create the schema and add reservation constraints, community safety, push delivery and check-in. Never rewrite an applied migration or run `db push` / `migrate reset` against shared data.

1. Provision a separate staging database and migration principal with schema DDL permission. API/worker should use a separate runtime principal with only required DML and sequence access. Audit/ledger immutability triggers remain active.
2. Back up the target; record release SHA, migration checksums and restore point. Set DATABASE_URL to the **direct** database endpoint, not a transaction pooler.
3. Run `npm ci`, `npm run db:validate`, `npm run db:generate`, `npx prisma migrate status`, then `npm run db:migrate:deploy` once as the release job.
4. Run `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code`. Also inspect custom GiST exclusions, triggers and checks: Prisma schema diff alone cannot prove custom SQL equivalence.
5. Deploy API and worker from the same release after migrations succeed. Readiness and synthetic booking/payment smoke checks must pass before enabling customer traffic.

## Compatibility and concurrency

Initial migration creates btree_gist for exclusion constraints; provider migration role must be permitted to install it. Custom SQL protects exclusive ranges, shared-session overlap, capacity, cost integrity and append-only audit/ledger data. Resource row locks and serializable retries coordinate competing bookings and maintenance blocks. Six current migrations are additive for v2; they do not migrate MongoDB records. Budget migration lock time against real dataset size; test on a sanitized copy before production.

Every process defaults to five Prisma connections with ten-second pool wait and five-second connect timeout unless URL parameters override. Budget `(API replicas + worker replicas) × pool size + migration/admin headroom` below database max_connections. Avoid introducing PgBouncer unless measured connection pressure warrants it; use a direct migration URL and test transaction-pooling compatibility separately.

## Recovery

If migration fails, stop rollout and inspect `_prisma_migrations` and database locks. Do not rerun SQL blindly or mark a failed migration applied without reconciling its statements. Correct forward where safe; use `prisma migrate resolve` only after documenting the actual database state. Application rollback is safe only while schema remains compatible. Destructive rollback requires restoring to a **new** database, reconciling post-backup payments/bookings, and an explicit cutover; never restore over the only copy.

MongoDB transition remains a separate ETL project: map legacy IDs to UUIDs, normalize money/timezones/roles, dry-run into an isolated database, reconcile every collection and money total, handle unmappable records, freeze writes or capture deltas, compare counts/checksums and only then change traffic. No automatic deletion or legacy cutover is part of this preparation.
