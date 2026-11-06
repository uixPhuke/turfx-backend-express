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
