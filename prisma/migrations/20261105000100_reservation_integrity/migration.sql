-- Preserve the original migrations; add relational invariants as a forward migration.
ALTER TABLE "CapacitySession" ADD CONSTRAINT capacity_sessions_no_overlap
  EXCLUDE USING gist ("resourceId" WITH =, tstzrange("startsAt", "endsAt", '[)') WITH &&);
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken" ("familyId");
CREATE INDEX "AuthChallenge_userId_purpose_createdAt_idx" ON "AuthChallenge" ("userId", "purpose", "createdAt" DESC);

CREATE FUNCTION playza_check_capacity_session() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE resource "Resource"%ROWTYPE;
BEGIN
  SELECT * INTO resource FROM "Resource" WHERE id = NEW."resourceId";
  IF resource.mode <> 'CAPACITY_BASED' OR NEW.capacity > resource.capacity THEN
    RAISE EXCEPTION 'Capacity session must fit a capacity-based resource' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER capacity_session_resource BEFORE INSERT OR UPDATE ON "CapacitySession"
  FOR EACH ROW EXECUTE FUNCTION playza_check_capacity_session();

CREATE FUNCTION playza_check_booking_resource() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE resource "Resource"%ROWTYPE; session "CapacitySession"%ROWTYPE;
BEGIN
  SELECT * INTO resource FROM "Resource" WHERE id = NEW."resourceId";
  IF NEW.participants > resource.capacity THEN
    RAISE EXCEPTION 'Participant capacity exceeded' USING ERRCODE = '23514';
  END IF;
  IF resource.mode = 'EXCLUSIVE' AND NEW."capacitySessionId" IS NOT NULL THEN
    RAISE EXCEPTION 'Exclusive bookings cannot reserve capacity sessions' USING ERRCODE = '23514';
  END IF;
  IF resource.mode = 'CAPACITY_BASED' THEN
    SELECT * INTO session FROM "CapacitySession" WHERE id = NEW."capacitySessionId";
    IF NOT FOUND OR session."resourceId" <> NEW."resourceId" OR
       session."startsAt" <> NEW."startsAt" OR session."endsAt" <> NEW."endsAt" THEN
      RAISE EXCEPTION 'Booking does not match its capacity session' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER booking_resource_integrity BEFORE INSERT OR UPDATE ON "Booking"
  FOR EACH ROW EXECUTE FUNCTION playza_check_booking_resource();

CREATE FUNCTION playza_check_reservation_origin() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE booking "Booking"%ROWTYPE; exception "AvailabilityException"%ROWTYPE;
BEGIN
  IF NEW."bookingId" IS NOT NULL THEN
    SELECT * INTO booking FROM "Booking" WHERE id = NEW."bookingId";
    IF NOT FOUND OR booking."resourceId" <> NEW."resourceId" OR
       booking."startsAt" <> NEW."startsAt" OR booking."endsAt" <> NEW."endsAt" OR
       booking."capacitySessionId" IS NOT NULL THEN
      RAISE EXCEPTION 'Reservation does not match its exclusive booking' USING ERRCODE = '23514';
    END IF;
  ELSE
    SELECT * INTO exception FROM "AvailabilityException" WHERE id = NEW."exceptionId";
    IF NOT FOUND OR exception."resourceId" <> NEW."resourceId" OR
       exception."startsAt" <> NEW."startsAt" OR exception."endsAt" <> NEW."endsAt" THEN
      RAISE EXCEPTION 'Reservation does not match its availability exception' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER reservation_origin_integrity BEFORE INSERT OR UPDATE ON "ResourceReservation"
  FOR EACH ROW EXECUTE FUNCTION playza_check_reservation_origin();
