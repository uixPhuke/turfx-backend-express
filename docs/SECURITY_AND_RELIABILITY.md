# Security and reliability review — 6 November 2026

Scope: current local v2 backend, preserved legacy regressions, mobile release configuration and deployment manifests. This is an engineering review, not penetration-test certification. Production traffic, provider checkout, signed device releases and real data were unavailable for verification.

## Controls reviewed and exercised

Access JWTs enforce purpose/issuer/audience and revocable sessions. Refresh rotation/replay revokes the token family; password reset revokes sessions. Registration cannot grant privileged roles. OTPs are HMAC-protected, expiring and attempt-limited. API and chat check current membership; venue staff cannot acquire ownership. Teams enforce a last administrator; private conversation content is not public discovery data. Booking transactions and SQL constraints coordinate exclusive ranges and shared capacity, and cancellation releases capacity once. Payment signatures bind stored orders; raw webhook bytes are verified before trusting payment events. Durable payment events, idempotency keys and refund bounds prevent duplicate state transitions.

Authenticated image upload enforces file count/size/signatures and delegates image decoding/transformations to Cloudinary. Server-only provider secrets remain outside mobile configuration. Native refresh tokens use SecureStore; web tokens remain in memory. Helmet, exact-origin CORS, bounded JSON/uploads, API/auth/OTP limits and socket event limits are configured. Production failures expose generic messages and request IDs, not stack traces or private paths.

## Hardening in this preparation

- Common deployed environment validation, exact HTTPS origins and staging/live Razorpay key-mode guard.
- Independent readiness/liveness, Redis-aware readiness and drain response; safe request logging and bounded HTTP timeouts.
- Per-process bounded Prisma pools and startup/shutdown handling; fatal events stop the process for platform restart.
- Worker job isolation prevents outbox failure from suppressing payment reconciliation; exhausted push leases become terminal failures.
- SMTP requires TLS with bounded connection/socket waits; Cloudinary and Razorpay transport waits are bounded. Razorpay SDK is pinned because timeout adaptation touches its internal per-client Axios transport.
- Mobile network calls abort after 20 seconds; native checkout uses a platform import so web does not require the native module. Non-production EAS builds have separate identifiers/schemes. Unneeded microphone/background-location permissions are blocked.
- Backup files are private, atomic and checksummed; restore refuses non-empty databases and is transactional.

## Open security/release risks

1. npm audit reports Prisma 6 CLI/config transitive `effect` and `deepmerge-ts` high advisories, and Expo image-size high plus transitive moderate advisories. The affected Prisma CLI dependency is retained through an @prisma/client peer even in an omit-dev tree. No claim of a vulnerability-free runtime image is made. Prisma config/Expo tools are not exposed as public request handlers, but build inputs and CI remain trusted-only. A tested compatible patch/SDK upgrade or explicit security-owner risk acceptance is required before public production launch; do not run `audit fix --force` and silently replace Prisma/Expo major versions.
2. Legacy MongoDB startup still contains verbose error logging and Mongoose deprecation warnings; it is not the new production entrypoint. Do not expose it as v2 or assume its security posture matches this review. Its data remains intact pending planned ETL.
3. No hosted alert destination, external error tracker, managed backup retention, operator on-call or production secret rotation has been verified. Provision these before public use. Logs are structured locally; monitoring is not attested merely by code presence.
4. Token/signing secrets, account access, maps restrictions, FCM/APNs and real webhook configuration still require operator setup. No private key should enter EXPO_PUBLIC variables or CI artifacts.
5. Full abuse, sustained load, two-replica reconnect, physical-device storage/permission and actual payment-provider tests remain staging gates.

No `.env` secret files were found in tracked backend paths (only `.env.example` is tracked). This check does not certify the entire historical Git history; perform a credential scan on the published release and rotate any historically leaked secrets.

## Phase 2 advisory remediation

The advisory counts in the original review are superseded. Effect 3.22.4 / DeepmergeTS 8.0.2 and scoped Glob 14.0.4 / Minimatch 11.0.5 overrides pass regression checks. Patched image-size 2.0.4 requires a reproducible Metro adapter for its named export and buffer/path calls; all platform exports and Expo Doctor pass. 14 November npm snapshot: backend production zero findings, full backend five low, mobile fourteen low; no high/moderate/critical. The remaining root advisory is deepmerge 4.3.1 prototype poisoning (no newer registry release found). Trusted build/config inputs and explicit low-risk disposition remain necessary. Actual private mobile and isolated backend staging publication excluded secret files; broader historical secret scanning remains a release gate.

## Free Supabase preparation — 15 November 2026

Dedicated staging project kebshsbehrajlrooykxn has no application tables yet. Removed public-schema access for PUBLIC/anon/authenticated/service_role and restricted future postgres-owned object grants, retaining backend database-owner access. btree_gist was relocated to extensions after the advisor flagged extension_in_public; a temporary UUID/time-range exclusion constraint passed under public-only search_path. Repeated security advisor returned zero lints. This is provider configuration evidence, not proof of application authorization, direct TLS/Prisma connectivity or production security. See [extension advisor remediation](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public).

## Current registry advisory snapshot — 17 November 2026

Fresh npm audit reports against registry.npmjs.org return zero advisories for the backend production tree, full backend tree and mobile tree. Raw reports and lockfile SHA256 fingerprints are retained in docs/evidence. These current registry results supersede previous advisory counts; they do not establish that all application vulnerabilities or historical secret exposure are resolved. No force upgrade, audit exclusion or new product feature was introduced.

## Git history secret scan — 17 November 2026

Gitleaks 8.30.1 scanned all available refs in the non-shallow isolated published staging checkouts: backend 94 commits, mobile 16 commits as reported by the scanner. Mobile had zero findings. Backend had one generic-api-key finding in historical docs/DEPLOYMENT.md:3, commit 645eab83a2ea92c8a20e1aec0ecc09efbe8d6006: the words notification/expiry in a worker description were misidentified as a credential. The actual source line was inspected and confirmed to be deployment prose, not a credential. Scanner raw exit1 is retained as one triaged false positive; it is not misreported as raw zero. No broad allowlist or rewritten history was introduced.

No confirmed credentials were detected within that scope. Redacted raw reports remain private locally; sanitized evidence records counts and the false-positive fingerprint. This does not scan unfetched remote refs, other services, ignored private environments or prove the absence of all possible secrets. Rotate any credential that an operator knows was exposed, regardless of this result.
