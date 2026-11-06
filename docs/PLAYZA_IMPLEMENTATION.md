# PLAYZA implementation decisions

Development is authorized across all phases; no further phase approval checkpoints are required.

## Architecture

Evolve the existing feature-based monolith. Keep the legacy API running on MongoDB while preparing PostgreSQL/Prisma alongside it. Do not silently switch persistence or alter existing data. The target contract is `prisma/schema.prisma`.

- One User identity, multiple platform roles, separate per-venue membership permissions.
- Venue → Facility → Resource. Multiple sports can share one physical resource.
- Exclusive allocation uses ResourceReservation for bookings and maintenance; an SQL exclusion constraint is the final concurrency authority.
- CapacitySession represents a fixed shared session. Reserve places transactionally using a guarded capacity update; never sum unlocked booking rows.
- Money uses integer minor units and explicit currency. Venue schedules use IANA timezones; reservations use UTC instants and half-open intervals.
- Payments allow multiple attempts per booking; provider identifiers and webhook receipts are unique. Refund state reflects provider evidence.
- Authentication uses sessions and rotated hashed refresh tokens in the target schema. Legacy authentication currently supports one rotating refresh token per account, with access revocation via tokenVersion; this is an intermediate compatibility implementation.
- Teams, games and bookings are distinct. Conversation membership controls private message access. Client message identifiers deduplicate retries.
- Outbox events persist transactionally with business operations before workers perform external effects.
- AuditLog and wallet ledger entries will be immutable through database constraints and explicit service rules.

## Migration

The Phase 1 audit contains the source-to-target mapping. Build schema migrations separately from import/backfill scripts. Rehearse in an isolated PostgreSQL database. Preserve legacy IDs, password hashes and media references; invalidate legacy sessions rather than migrating plaintext tokens. Quarantine invalid references/financial discrepancies instead of fabricating replacements. Source data remains intact.

Cutover requires count/amount reconciliation, concurrent booking tests, provider settlement reconciliation and a write-freeze/final-delta procedure. After target writes begin, rollback requires reverse reconciliation, not merely changing a connection string.

## Verified implementation as of 5 November 2026

The PostgreSQL API is separately runnable with `npm run start:postgres`. See [the API contract](POSTGRES_API.md). It implements customer authentication, hashed one-time challenges, per-device sessions, rotating refresh tokens with replay revocation, approved venue/sport discovery and customer-scoped reservations/cancellation.

The reservation service uses serializable transactions, database overlap constraints and guarded session capacity updates. Hold creation, cancellation and expiration record outbox events transactionally. The standalone server sweeps expired holds every 30 seconds. Forward migration 20261105000100 adds capacity-session nonoverlap and relational integrity triggers.

Validation: 93 legacy/security tests passed, including the added OTP integration tests; 18 PostgreSQL HTTP/concurrency/integrity tests passed. Type checking and lint passed. Migrations were applied only to the isolated local test instance. No legacy data was imported or deleted and no production persistence switch occurred.

## Current limits

PostgreSQL payments/webhook receipt processing, reconciliation, outbox delivery, owner-management endpoints, migration/import tooling and the mobile application remain to be implemented. The existing MongoDB booking/payment flows are still the legacy API; the PostgreSQL engine does not silently replace them. Legacy withdrawals return unavailable until a provider-backed payout lifecycle exists. Clients must sign in again after the legacy token changes and store the replacement refresh token returned on every refresh.
