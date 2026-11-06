# MongoDB to PostgreSQL migration and reconciliation plan

Status: migration design and read-only inventory tooling prepared. No source data has been imported or deleted. Staging must use synthetic/sanitized data until privacy-approved source access and an actual dry run are complete. A successful schema restore does not validate business-data migration.

## Discovery and mapping

Use an actual read-only MongoDB principal, restrict network access, then run `PLAYZA_MIGRATION_READ_ONLY=yes node scripts/migration-inventory.cjs`. Capture the count/index inventory in restricted storage, not the public repository. The script does not export documents; a complete field-quality audit remains a separate controlled step.

| Legacy source | PostgreSQL target / transformation | Reconciliation gate |
|---|---|---|
| User | User + UserRole + VenueMember; deterministic ObjectId-to-UUID mapping stored in a restricted migration manifest | Normalized email/phone uniqueness; blocked/deleted/verified state preserved; privilege assignment independently reviewed |
| Admin | Explicit reviewed platform roles; do not infer admin from user input | Named operator authorization; no broad role grants |
| Turf | Venue + Facility + Resource + ResourceSport + VenueMedia; one legacy turf may expand into several target records | Ownership, approval, address, timezone, sport mapping and image references complete |
| Slot | OperatingHour/AvailabilityException and bookable resource times; historical slots become booking snapshots where appropriate | Timezone/DST rules explicit; end after start; no overlapping exclusive reservations |
| Booking | Booking pricing/status snapshots + ResourceReservation + AuditLog/OutboxEvent where supported, links via ID manifest | Every booking maps or is quarantined with reason; statuses/capacity/time ranges and immutable references verified |
| Payment | Payment + PaymentWebhookEvent + Refund + WalletLedgerEntry according to provider-confirmed state; capture is Payment state, not a separate model | Exact provider order/payment/refund IDs; money totals by currency/status; no invented captures or duplicate refunds |
| Wallet embedded transactions | WalletAccount + WalletLedgerEntry with opening-balance provenance; retain original journal in restricted archive | Credits minus debits equals balance for every wallet; review unexplained differences before import |
| Coupon | Coupon with explicit scope, dates, limits and value semantics | Distinguish percentage from fixed rupee/minor-unit values; compare usage totals |
| Review/Favorite/Notification | Review/Favourite/Notification with mapped relations | Orphan references quarantined; no old push token activation without current consent |
| Auth sessions/OTP | Do not import active tokens/challenges | Force sign-in/reset as required; retain compatible bcrypt hashes only after format/cost inspection |

Legacy prices are JavaScript Numbers and must not be assumed to be minor units. Confirm each field's semantics from actual persisted samples and provider records. Convert currency amounts using decimal-safe string arithmetic and explicit rounding policy; never multiply floating-point values and silently round financial history. Confirm legacy local dates/time strings against venue timezone; do not use the new cancellation policy retroactively to rewrite historical entitlements.

## Dry-run pipeline

1. Take consistent encrypted source snapshot and record source timestamp/counts/checksums. Exclude raw secrets and refresh/OTP material from working exports.
2. Write versioned extract/normalize/load stages with resumable batch IDs and deterministic ID mapping. Validate against the real source before implementation is considered complete.
3. Load users/roles, sports, venue hierarchy, resources/hours, bookings, financial state, then dependent customer records into an isolated database. Disable payment/email/push workers during import. Preserve constraints; quarantine conflicts instead of bypassing them.
4. Reconcile source count = migrated + explicitly rejected for each collection; every relationship resolves; active exclusive overlaps = 0; shared capacity <= limit. Compare signed ledger sums, captured/refunded/remaining totals and wallet balances by currency. Compare provider statements for all unsettled payments/refunds.
5. Generate a restricted reconciliation report with aggregates and failure categories. Never log plaintext passwords, tokens, private chat or full user records. Run target API tests against sanitized records and independently review privileged roles and money totals.
6. Rehearse rollback and measure duration using production-sized data. The actual ETL implementation, sample validation and money reconciliation are not yet complete.

## Cutover and recovery

Prefer a scheduled write freeze for the first cutover. Put legacy booking/payment writes in maintenance, stop legacy jobs, capture final delta and webhook receipts, load/reconcile, and change API routing only after zero unexplained financial/capacity differences. Keep legacy source read-only with retention. Start target worker only after confirming event ownership so two systems cannot refund or notify the same event.

Rollback before new writes: revert routing to legacy and preserve target evidence. Rollback after target writes requires a reviewed reverse-delta/reconciliation plan; do not blindly switch back and lose bookings/payments. Retain source snapshots and ID manifests encrypted, restrict access and establish retention/deletion policy after acceptance.
