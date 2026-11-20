# Compact actions and conversation layout — 19 November 2026

## User-requested corrections

The black/lime arrow treatment remains on primary tasks such as signing in, saving the profile and booking/payment. Secondary Button controls now size to their content instead of stretching across a card. Shared TextAction controls provide compact icon-and-label actions with a minimum44px touch target. Inputs have a visible border, including inside white cards.

- Edit profile: avatar preview and compact Change photo action; grouped personal details; original Save profile primary CTA preserved. Blocked-player actions are compact.
- Business: owner applications have readable status badges and explanations; Apply opens a separate, clearly labeled form with Cancel and a compact Submit action. The application form is not permanently displayed under pending applications. Existing staff navigation stays compact.
- Community: organize/create/chat shortcuts; team cards show member counts, membership role and compact Members/Invite actions. Only one team's invite form is open at a time; switching teams clears the draft. Creation appears only after Create team. Existing team-admin permissions determine the invite action. Team/game data refresh on screen focus. Game navigation leads to its existing detail/join flow.
- Team membership: role and leave/remove actions no longer stretch full width. Existing server authorization remains authoritative.
- Conversation: fixed header with actual route conversation name and connection state; scrollable dated history; tighter incoming/outgoing bubbles with readable timestamps; no redundant own sender name. Keyboard-aware bottom composer includes a compact circular send button, loading/disabled states and a bounded multiline input. Message options are a separate bottom sheet, retaining report/block functionality. Existing API, authenticated Socket.IO, retries, pagination and message idempotency remain in use.

## Validation

Mobile verify passed: TypeScript, ESLint, app variant/transport checks, five upload tests and three location tests. Final typecheck/lint rerun passed after the community focus-refresh fix.

Browser checks at320px: profile photo action and Save profile hierarchy; community card layouts; create-form open/cancel; invitation field visibility and per-team draft isolation; owner application open/cancel; chat composer enabled/disabled, message options open/close, live socket connected, and successful send/reopen in a single-member synthetic local QA team. No real person was messaged or invited, no owner application was submitted and no real profile data was changed. Two labeled local QA teams were prepared via the existing API on the synthetic visual QA account.

Evidence in docs/ui-qa:
- profile-compact-320-1119.jpg
- community-compact-320-1119.jpg
- owner-application-compact-320-1119.jpg
- chat-composer-320-1119.jpg
- chat-outgoing-320-1119.jpg

This is local browser/UI verification. Physical iOS/Android keyboard, safe-area, text-size and native gesture testing remain outstanding. Previously signed binaries predate these changes. Earlier backend PostgreSQL52/52 results remain the latest backend regression evidence; no backend source/schema changes were required for this correction.

Final Android/iOS/web export passed: `/private/tmp/playza-compact-chat-export-1119`. These are bundle/static exports, not signed native releases. Source diff whitespace check passed.
