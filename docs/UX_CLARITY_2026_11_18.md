# PLAYZA navigation and discovery update — 18 November 2026

## Implemented

- Business tools use four compact lime icon shortcuts with captions: Venues, Check-in, Bookings and Staff. Staff opens an explicit venue selector and the existing venue-scoped permissions screen.
- Team chats use the same action language for Chats, Invites and Play together; selection and actual conversation/invitation counts are visible.
- The shared button now defaults to a normal button. The black pill with lime arrow is opt-in (`journey`) and reserved for the main Book now / Confirm booking / Proceed to pay actions.
- Favourites show the ordered cover image (brand illustration only when absent), venue name, address, description, actual starting hourly price and available-slot navigation. Removing a saved venue remains supported.
- Notifications show creation time, read state and authorized booking context: venue/resource, venue-local session time/timezone, current booking status, amount and reference. Read/unread filtering and booking navigation remain available. Raw notification payloads are not exposed; booking enrichment requires customer ownership.
- Permission-driven foreground location on Home and Nearby searches approved active venues within 25 km, sorted by actual great-circle distance. Search and sport filters remain available. Coordinates are rounded to four decimals for API requests, held in memory and cleared at logout. No background location tracking. Location acquisition has a 15-second timeout and manual search remains available.
- Nearby maps use actual geographic tiles: native map where configured; OpenStreetMap embed for web and keyless Android fallback. OSM attribution is preserved. Coordinates of the selected venue (or current search location when no results) are shared with the map provider to render the map.
- Razorpay Standard Checkout remains the payment method selector and verification path. UPI Intent on supported mobile devices and dynamic QR on desktop depend on the provider account, platform and eligible currency; no fake QR or unverified manual payment success flow is added. See https://razorpay.com/docs/payments/payment-methods/upi/faqs .

## Scope and limitations

Nearby discovery identifies geographically nearby active venues; it does not promise a free slot for an unspecified date/time. Existing resource availability and booking consistency checks remain authoritative. The distance SQL uses bound parameters and existing PostgreSQL coordinates without a schema migration. Large-catalog geographic indexing/performance must be measured before scale-up.

Favourites are bounded to the existing latest 100 saved venues; notification filtering applies to the latest inbox page. Price is a starting hourly equivalent, not a final quote. Existing server pricing and checkout totals remain authoritative.

This is a local implementation and validation update. Dedicated Next.js owner/admin dashboards remain governed by APPLICATION_ARCHITECTURE.md; these changes improve existing transitional mobile tools.

## Evidence

- Fresh isolated PostgreSQL database: all six migrations applied; 52 regression tests passed, zero failed/skipped, including nearby coordinate validation, radius/sport filters, distance ordering, out-of-range pagination totals, wishlist public metadata and foreign-booking/foreign-notification access boundaries.
- Backend Prisma validation, TypeScript and ESLint passed (schema check uses a test DATABASE_URL).
- Mobile TypeScript, ESLint, app-variant guards, five existing photo-upload tests and three new location tests passed.
- Live local Docker API and worker rebuilt. Browser verified compact owner grid, staff venue selection/navigation, wishlist image/details/price, chat invitation selection, real OSM map tiles and enriched notification/read/unread behavior using clearly synthetic local accounts and bookings.
- Browser location acquisition did not return actual device coordinates; no successful physical-location claim. Permission-denial and granted-coordinate store paths are unit tested, API distance behavior is PostgreSQL integration tested.
- No completed UPI/QR transaction, real capture/refund/webhook, physical-device GPS, native map or push-delivery certification in this update. Signed binaries predate these changes and need rebuilding.

## Final verification — 19 November 2026

- Mobile `npm run verify` passed again: app variant/transport guards, TypeScript, ESLint, five upload and three location tests. Added an in-flight request cancellation regression: clearing/logout prevents late coordinates from restoring location; session expiry also clears location.
- Final Android, iOS and web export succeeded to `/private/tmp/playza-ux-export-1119-final`. These are JavaScript bundles/static web output, not newly signed APK/IPA builds.
- Local Docker PostgreSQL, Redis and API are healthy; worker running. API `/api/v2/health` returns healthy. Existing local database and fixtures preserved.
- No real external payment completed. Native checkout, push delivery, native GPS/map gestures and physical-device QA remain outstanding. No staging/production verification inferred from local evidence.

Browser follow-through (19 November): confirmed the location timeout message, restored location button, and successful manual Midtown search afterward. Preview HTTP200 at http://localhost:8081/; left the synthetic local customer session open. Evidence: mobile docs/ui-qa/location-timeout-search-1119.jpg.

## Button hierarchy correction — 19 November 2026

User clarified that main buttons should retain the original black pill/lime-arrow design. Restored that treatment for authentication and primary submit/save/create actions, while preserving compact navigation shortcuts and standard secondary controls. Per-venue Staff permissions is now a small icon/text/chevron action with a 44px touch target, not a stretched button. TypeScript and ESLint passed; browser confirmed the compact action still opens the correct venue staff screen. This supersedes the earlier restriction of arrow styling to booking/payment alone.
