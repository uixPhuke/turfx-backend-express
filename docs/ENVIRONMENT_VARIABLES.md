# Environment variables

Never store secrets in Git, mobile public variables, images, logs or CI artifacts. Configure independent staging and production secrets. All examples are placeholders. `NODE_ENV=production` enables deployed safety checks for both staging and production; `APP_ENV` selects provider mode.

| Variable | Service | Requirement / purpose | Placeholder |
|---|---|---|---|
| NODE_ENV | API, worker | development locally; production on deployed services | production |
| APP_ENV | API, worker | local, staging or production; required explicitly when deployed | staging |
| DATABASE_URL | API, worker, migration | PostgreSQL URL; Prisma 6 pool parameters supported; use direct endpoint for migrations | postgresql://user:password@db:5432/playza?connection_limit=5&pool_timeout=10&connect_timeout=5 |
| REDIS_URL | API | required deployed; private network or verified TLS over public network | rediss://user:password@cache:6379 |
| POSTGRES_API_PORT | API | optional, default 8001; Render uses 10000 | 8001 |
| TRUST_PROXY_HOPS | API | default 0; exact edge topology, Render 1; never blindly trust client forwarding headers | 1 |
| JWT_SECRET | API | required, unique random >=32 characters | replace-access-secret |
| REFRESH_TOKEN_SECRET | API | required, distinct random >=32 characters | replace-refresh-secret |
| OTP_SECRET | API | required, distinct random >=32 characters | replace-challenge-secret |
| ALLOWED_ORIGINS | API | exact comma-separated browser origins, HTTPS deployed; no path/wildcard | https://staging.example.com |
| EMAIL_USER / EMAIL_PASS | API | required deployed; Gmail SMTP account/app password | mail@example.com / secret |
| CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET | API | required deployed; isolated media account/folder policy | cloud-name / key / secret |
| RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET | API, worker | required deployed; rzp_test_ staging, rzp_live_ production | rzp_test_placeholder / secret |
| RAZORPAY_WEBHOOK_SECRET | API | independent webhook signing secret, required deployed | replace-webhook-secret |
| BOOKING_TAX_BPS | API | optional default 0, 0–10000; operator-approved tax policy | 0 |
| BOOKING_FEE_MINOR | API | optional default 0, nonnegative bounded minor currency units | 0 |
| EXPO_ACCESS_TOKEN | worker | optional unless Expo push security enabled; service-scoped token | secret |
| LOG_LEVEL | API, worker | Pino severity, default info | info |
| SERVICE_NAME | API, worker | optional structured-log service label | playza-api-staging |
| PLAYZA_ADMIN_EMAIL | bootstrap script | verified initial operator email only | operator@example.com |
| PLAYZA_PREVIEW_DATABASE_URL | local fixture script | isolated loopback playza_preview database only; never deployed | postgresql://playza@127.0.0.1:55439/playza_preview |
| REDIS_SERVER_BIN | local process test | optional path, default redis-server | /usr/bin/redis-server |
| PLAYZA_TEST_DATABASE_URL | test runner | isolated loopback PostgreSQL port 55439 only; never staging/prod | postgresql://playza:fixture@127.0.0.1:55439/playza_test |
| PLAYZA_SMOKE_URL | smoke script | HTTPS staging base ending /api/v2 | https://api-staging.example.com/api/v2 |
| PLAYZA_ENV_FILE | Compose | optional path to private service environment file, default .env.release | /secure/playza-staging.env |
| PLAYZA_MIGRATION_READ_ONLY | inventory script | explicit yes enables authorized read-only MongoDB inventory | yes |
| POSTGRES_PASSWORD | Compose | required URL-safe generated password | replace-with-random-hex |
| API_DOMAIN | optional Caddy | DNS name for self-hosted TLS | api-staging.example.com |
| BACKUP_DIR | backup script | private encrypted storage directory | /secure/backups |
| RESTORE_DATABASE_URL / RESTORE_CONFIRM_EMPTY | restore script | new empty isolated DB; explicit confirmation yes | postgresql://... / yes |
| EXPO_PUBLIC_API_URL | mobile | public HTTPS API URL ending /api/v2; separate EAS environments | https://api-staging.example.com/api/v2 |
| EXPO_PUBLIC_EAS_PROJECT_ID | mobile | actual EAS project UUID, not a credential | project-uuid |
| EXPO_PUBLIC_ANDROID_MAPS_API_KEY | mobile Android | public embedded key restricted to package + signing SHA-1 and Maps SDK | restricted-key |
| GOOGLE_SERVICES_JSON | EAS Android | secret/file environment variable pointing to Firebase configuration file | /path/google-services.json |
| EAS_BUILD_PROFILE | EAS injected | chooses production or staging app identifiers; do not manually put in app secrets | preview |

Legacy-only variables remain in `.env.example`: PORT, MONGODB_URI, DB_NAME, JWT_EXPIRE, REFRESH_TOKEN_EXPIRE, CLIENT_URL and API_URL. They do not configure v2. Preserved legacy mobile API_BASE_URL is unused by active PLAYZA screens. Firebase Admin credentials in the old MongoDB service do not configure v2 Expo push: Android FCM v1 service-account credentials and iOS APNs credentials are uploaded to EAS, never embedded as private keys in the app.
