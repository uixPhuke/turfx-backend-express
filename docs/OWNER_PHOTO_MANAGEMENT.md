# Owner turf photo management — 18 November 2026

## Implemented workflow

In the existing Expo app: Profile → Manage your venues → Manage venues → select a venue → Turf photos. The creation form is optional once venues exist. Newly created venues/facilities/resources select automatically; their name fields are independent.

Owners/managers can choose multiple photos with previews, remove queued items, upload a batch with per-photo progress/results, retry failures, inspect full-size saved images, change the cover, move photos earlier/later and remove saved photos through confirmation. Uploading locks venue selection and other mutations so a batch cannot switch venue mid-flight. Successful uploads leave the queue; a failed photo does not cause already successful photos to be resent. The gallery can be refreshed independently. The first saved photo is the public cover after normal venue approval; pending test venues stay hidden from customer discovery.

Limits: 10 selected per batch, 20 saved per venue, 8 MB per image; JPEG/PNG/WebP only. HEIC/GIF are not accepted. Native HEIC should be exported as JPEG before selection. Server checks file signatures, venue management permissions and size; Cloudinary decodes/transforms stored files. Photo count and append positions are checked under a venue-row lock so concurrent uploads cannot bypass the limit. No schema migration or second backend was introduced.

## Shared API contract

- `GET /api/v2/owner/venues` now includes ordered `venueMedia_venue` entries (`id`, `url`, `position`) without provider public IDs.
- `POST /api/v2/owner/venues/:id/media` retains one multipart `image` per request. The client sends a selected batch sequentially; bounded requests reduce memory use and isolate failures. It returns the saved photo. At 20 photos it returns 409; cleanup is attempted if a database write fails.
- `PATCH /api/v2/owner/venues/:id/media/order` accepts `{ "mediaIds": ["<uuid>", "<uuid>"] }`. Supply every current photo exactly once, in order. First is the cover. Duplicate IDs return 400; stale/incomplete/foreign sets return 409. Permission checks run before reading or mutating the gallery.
- `DELETE /api/v2/owner/venues/:id/media/:mediaId` removes the scoped photo from image storage and SQL. It is a permanent removal, so the client shows confirmation first; re-upload requires the original file.
- Existing customer list/detail photo ordering follows the saved positions, with deterministic ID tie-breaking.

Only active venue OWNER/MANAGER memberships may change photos. A platform OWNER role alone does not grant access to another venue; STAFF membership does not grant photo editing. Provider secrets stay in the API, never Expo public variables. Pending/approved venue verification behavior is unchanged.

## Verification evidence

17 November backend: six migrations applied to a fresh disposable PostgreSQL 18 database; all 50 PostgreSQL tests passed, zero failures/skips. New cases exercise gallery completeness, duplicate/foreign/stale order rejection, unauthenticated/cross-venue denial, public cover order and parallel uploads at the limit. Existing file validation/removal tests remain. Provider calls are mocked in this suite. The disposable test container was removed; application data was not reset.

Mobile: five upload tests cover picker cancellation/options, platforms ignoring selection limits, unsupported/oversize rejection before API use, multipart file/name preservation and single-image avatar compatibility. These run in `npm run verify` alongside profile transport guards, TypeScript and ESLint. No dependencies were added.

Actual browser + local API + Cloudinary: a synthetic pending venue named Photo gallery QA turf was created through the owner UI. Two generated QA images were selected together. Initial batch saved one and left one failure queued; manual retry saved the remaining image, yielding exactly two saved photos. Cover change, both reorder directions, refresh persistence and full-size preview were exercised. Removal confirmation was opened and cancelled; no actual saved image was deleted through this browser flow. The synthetic pending venue/photos remain available for local owner testing. This is not a production venue approval or a paid reservation.

Responsive evidence: 320px gallery has two photo columns and document width equal to viewport width. Final browser evidence and export results are appended below after the final check. Old generic empty-text console errors from the Business screen were corrected by boolean guarding its message.

## Boundaries and remaining checks

Physical Android/iOS picker permissions, device lifecycle, poor-network behavior and updated signed-build QA remain unverified. A timed-out upload has an uncertain outcome: refresh/review the saved gallery before retrying, because this endpoint does not provide upload idempotency. No automatic retry is performed. The UI retains failed items and explains how to retry/remove them.

This completes the scoped gallery and related owner-form work, not every owner platform capability. The dedicated responsive Next.js owner dashboard, separate admin dashboard, full dashboard permissions/contract review, accurate settled-revenue reporting and existing staging/provider/device gates remain in DELIVERY_PLAN.md. Existing booking, pricing, hours, staff and check-in controls were retained, not comprehensively recertified here. No production deployment, new infrastructure purchase or schema cutover was performed.

## Final local check — 18 November 2026

Mobile verification (seven build profiles, TypeScript, ESLint and all five photo tests) passed. Backend Prisma validation/typecheck/lint passed; schema validation used a placeholder URL and is not a new managed-database connection test. Existing Docker API/worker/PostgreSQL/Redis were restored healthy, preserving the demo owner and two stored photos. Final gallery refresh/form open-close checks produced zero new browser console errors after the empty resource-ID guard fix. At320px document and viewport widths both equal320; two-column gallery remains usable. Screenshots: mobile docs/ui-qa/owner-gallery-final.jpg (390×844) and owner-gallery-320.jpg (320×740).

Final Android/iOS/web bundle export passed on18 November: `/private/tmp/playza-owner-gallery-final-1118` (42 static web routes). These are JavaScript/Hermes compilation checks, not new signed APK/IPA builds. Source remains in the local working codebase; no GitHub push or production deployment is claimed for this gallery update.
