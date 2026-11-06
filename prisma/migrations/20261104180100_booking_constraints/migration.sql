-- New tables only. No source data is modified by this migration.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "ResourceReservation"
  ADD CONSTRAINT reservation_positive_interval CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT reservation_single_origin CHECK (num_nonnulls("bookingId", "exceptionId") = 1),
  ADD CONSTRAINT resource_no_overlap EXCLUDE USING gist
    ("resourceId" WITH =, tstzrange("startsAt", "endsAt", '[)') WITH &&)
    WHERE ("isBlocking");

ALTER TABLE "Resource" ADD CONSTRAINT resource_limits
  CHECK (capacity > 0 AND "slotMinutes" > 0);
ALTER TABLE "OperatingHour" ADD CONSTRAINT operating_hour_limits
  CHECK (weekday BETWEEN 0 AND 6 AND "opensMinute" >= 0 AND
         "closesMinute" <= 1440 AND "opensMinute" < "closesMinute");
ALTER TABLE "CapacitySession" ADD CONSTRAINT capacity_session_limits
  CHECK ("endsAt" > "startsAt" AND capacity > 0 AND reserved BETWEEN 0 AND capacity);
ALTER TABLE "AvailabilityException" ADD CONSTRAINT exception_positive_interval
  CHECK ("endsAt" > "startsAt");
ALTER TABLE "Booking" ADD CONSTRAINT booking_limits
  CHECK ("endsAt" > "startsAt" AND participants > 0 AND "subtotalMinor" >= 0 AND
         "taxMinor" >= 0 AND "feeMinor" >= 0 AND "discountMinor" >= 0 AND
         "totalMinor" >= 0 AND "totalMinor" = "subtotalMinor" + "taxMinor" + "feeMinor" - "discountMinor");
ALTER TABLE "Payment" ADD CONSTRAINT payment_amount_nonnegative CHECK ("amountMinor" >= 0);
ALTER TABLE "Refund" ADD CONSTRAINT refund_amount_positive CHECK ("amountMinor" > 0);
ALTER TABLE "PricingRule" ADD CONSTRAINT price_nonnegative CHECK ("amountMinor" >= 0);
ALTER TABLE "WalletAccount" ADD CONSTRAINT wallet_balances
  CHECK ("balanceMinor" >= 0 AND "frozenMinor" BETWEEN 0 AND "balanceMinor");
ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT ledger_balance_nonnegative CHECK ("balanceAfterMinor" >= 0);
ALTER TABLE "Review" ADD CONSTRAINT review_rating CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE "Game" ADD CONSTRAINT game_limits
  CHECK ("participantLimit" > 0 AND "endsAt" > "startsAt");
ALTER TABLE "Venue" ADD CONSTRAINT venue_coordinates
  CHECK (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180);

-- Immutable financial and audit history; corrections are additional entries.
CREATE FUNCTION playza_reject_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'PLAYZA history is append-only' USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER wallet_ledger_immutable BEFORE UPDATE OR DELETE ON "WalletLedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION playza_reject_history_mutation();
CREATE TRIGGER audit_log_immutable BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION playza_reject_history_mutation();
