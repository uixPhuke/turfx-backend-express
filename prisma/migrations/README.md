# Migration safety

These migrations create a new PostgreSQL schema. They do not import or delete MongoDB data.

All three migrations, including the forward relational-integrity migration, must be applied before the PostgreSQL API is enabled. Prisma's generated schema cannot express the exclusion constraint or append-only triggers; preserve the custom SQL migrations.

Hold expiry explicitly sets ResourceReservation.isBlocking=false inside the same booking lifecycle transaction. Capacity reservations use a guarded UPDATE of CapacitySession.reserved and create a booking in the same transaction. AvailabilityException rows must create their blocking ResourceReservation in that transaction.

Production migrations are forward-only. There is no automatic destructive down script. Before first production use, rollback means retaining the legacy API and leaving the new schema unused. After target writes begin, use forward repair and reconciled data replay. Never reset a production database or drop this schema to roll back.
