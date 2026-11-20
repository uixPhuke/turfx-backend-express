# PLAYZA group-chat flow — 20 November 2026

## Navigation

Chats → New group → dedicated name/description screen → Create group → actual group conversation.

Tap the group name in the chat header → Group info → Add members → dedicated invitation screen.

Community lists groups and opens their chats; its Group info link opens member settings. Inline create/invite forms were removed from Community. Visible New group labels avoid requiring users to guess a compose icon.

Group info shows name, description, member count, compact member rows, You and Group admin badges. Other-member admin/remove controls live in a member options menu and require confirmation. No self-demotion control is shown. Exit group is separate; the existing backend requires appointing another admin before the final admin leaves, so the UI explains and disables this unsupported exit rather than showing a doomed action.

PLAYZA retains its existing invitation model: members join after accepting. This is not phone-contact import or immediate WhatsApp contact addition. Voice/video, attachments, typing/read/delivery receipts, group photo/rename and other WhatsApp features are not claimed by this change.

## Evidence

- 19 November: created `Local QA group flow` on the synthetic visual QA account through the new screen; verified immediate navigation to its server-created chat, persisted appearance in Chats, header → Group info, You/admin display, absent self-demotion and separate invitation navigation at320px. No real player invited or permission changed.
- New screens use existing POST /teams, GET /teams, GET /conversations, team invite/member endpoints and existing authenticated message implementation. No database/schema/backend source changes.
- Current mobile verify passes TypeScript, ESLint, build-variant/transport guards and10 tests:5 photo upload,3 location,2 monetary formatting tests.
- Screenshots: docs/ui-qa/new-group-screen-320-1119.jpg, group-info-320-1119.jpg, invite-members-screen-320-1119.jpg.
- Physical-device keyboard/safe areas, multi-account invitation acceptance, member promotion/removal/exit UI execution and signed builds remain separate release checks. Existing backend lifecycle regression coverage remains the prior PostgreSQL52/52 result; it was not rerun for these frontend changes.

## UI consistency follow-through

20 November: business shortcuts reflect current role and venue assignments; unavailable tools have explanatory copy. Staff assignment uses one role selector and a single submit action, with human-readable roles and removal confirmation. Game leave/cancel actions require confirmation; cancellation states clearly distinguish a game from a separately paid venue booking. Network errors are human readable. Shared monetary display preserves cents/paise (e.g. $41.60, ₹1.25), covered by regression tests.

This is a review and correction of key flows, not proof that every user, accessibility setting or physical device will find the entire application unambiguous. Broader native-device/accessibility and real provider QA remain required before release.

Final local verification20 November: mobile verify passes all10 tests and build-variant, TypeScript and ESLint checks. Browser confirmed customer business controls disabled with explanation, approved-owner controls available, staff form open/cancel and manager selection with aria-checked=true at320px. No staff access changed. Restored local Docker environment after Docker Desktop was stopped; local accounts and data preserved. Added clear game leave/cancel confirmation (source/typechecked; no actual cancellation executed in this review).

Android/iOS/web bundle export succeeded20 November: `/private/tmp/playza-groups-ux-final-1120`. These are bundle/static outputs, not signed APK/IPA releases. API, PostgreSQL and Redis healthy; worker running. UI changes remain local.
