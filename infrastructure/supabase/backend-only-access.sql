-- Apply only to a dedicated PLAYZA Supabase project, before Prisma migrations.
-- Keep this provider hardening outside the provider-neutral Prisma history.
-- Express/Prisma owns access; Supabase browser Data API is unused.
REVOKE ALL ON SCHEMA public FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- For a project where this extension already exists in public:
-- ALTER EXTENSION btree_gist SET SCHEMA extensions;
