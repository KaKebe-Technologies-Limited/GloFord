-- ────────────────────────────────────────────────────────────
-- RLS enforcement: create a non-superuser application role so the
-- row-level-security policies in 30000000000000_enable_rls actually
-- bite. Superusers (and BYPASSRLS roles) short-circuit RLS entirely,
-- so until this migration runs the policies are documentation only.
--
-- Role split (runtime connections):
--   DIRECT_URL  -> gloford  (superuser, for migrations + seed)
--   DATABASE_URL-> gloford_app (NOSUPERUSER NOBYPASSRLS, for runtime)
--
-- Also extends every tenant RLS policy with a SYSTEM-role bypass so
-- Inngest crons and webhook handlers (running on the NOSUPERUSER
-- connection) can still do cross-tenant work via runAsSystem(). The
-- bypass fires only when the session GUC `app.current_role` equals
-- 'SYSTEM' — user-request paths set it to ADMIN/EDITOR/VIEWER/etc.
-- ────────────────────────────────────────────────────────────

-- ─── Role creation ────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gloford_app') THEN
    CREATE ROLE gloford_app LOGIN PASSWORD 'gloford_app' NOSUPERUSER NOBYPASSRLS;
  ELSE
    ALTER ROLE gloford_app NOSUPERUSER NOBYPASSRLS;
  END IF;
END$$;

GRANT USAGE ON SCHEMA public TO gloford_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gloford_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gloford_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO gloford_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gloford_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO gloford_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO gloford_app;

GRANT SELECT ON TABLE "_prisma_migrations" TO gloford_app;

-- ─── Extend tenant policies with SYSTEM-role bypass ───
DO $$
DECLARE
  t text;
  strict_tables text[] := ARRAY[
    'Page', 'Program', 'Post', 'Tag', 'Media',
    'Campaign', 'Donor', 'Donation',
    'SiteSettings', 'Theme',
    'Subscriber', 'Newsletter', 'Segment',
    'EmailCampaign', 'Event',
    'NavItem', 'Version'
  ];
BEGIN
  FOREACH t IN ARRAY strict_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_tenant', t);
    EXECUTE format($p$
      CREATE POLICY %I ON %I
        USING (
          "organizationId" = app_current_org()
          OR app_current_role() = 'SYSTEM'
        )
        WITH CHECK (
          "organizationId" = app_current_org()
          OR app_current_role() = 'SYSTEM'
        );
    $p$, t || '_tenant', t);
  END LOOP;
END$$;

DO $$
DECLARE
  t text;
  nullable_tables text[] := ARRAY[
    'FeatureFlag', 'AuditLog', 'DeadLetter', 'WebhookEvent'
  ];
BEGIN
  FOREACH t IN ARRAY nullable_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_tenant', t);
    EXECUTE format($p$
      CREATE POLICY %I ON %I
        USING (
          "organizationId" = app_current_org()
          OR ("organizationId" IS NULL AND app_current_org() IS NULL)
          OR app_current_role() = 'SYSTEM'
        )
        WITH CHECK (
          "organizationId" = app_current_org()
          OR ("organizationId" IS NULL AND app_current_org() IS NULL)
          OR app_current_role() = 'SYSTEM'
        );
    $p$, t || '_tenant', t);
  END LOOP;
END$$;

-- Join-table policies (named individually in the init RLS migration).
DROP POLICY IF EXISTS "CampaignEmail_tenant" ON "CampaignEmail";
CREATE POLICY "CampaignEmail_tenant" ON "CampaignEmail"
  USING (EXISTS (
    SELECT 1 FROM "EmailCampaign" c WHERE c.id = "campaignId" AND c."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM')
  WITH CHECK (EXISTS (
    SELECT 1 FROM "EmailCampaign" c WHERE c.id = "campaignId" AND c."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM');

DROP POLICY IF EXISTS "CampaignEnrollment_tenant" ON "CampaignEnrollment";
CREATE POLICY "CampaignEnrollment_tenant" ON "CampaignEnrollment"
  USING (EXISTS (
    SELECT 1 FROM "EmailCampaign" c WHERE c.id = "campaignId" AND c."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM')
  WITH CHECK (EXISTS (
    SELECT 1 FROM "EmailCampaign" c WHERE c.id = "campaignId" AND c."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM');

DROP POLICY IF EXISTS "EventNotification_tenant" ON "EventNotification";
CREATE POLICY "EventNotification_tenant" ON "EventNotification"
  USING (EXISTS (
    SELECT 1 FROM "Event" e WHERE e.id = "eventId" AND e."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM')
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Event" e WHERE e.id = "eventId" AND e."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM');

DROP POLICY IF EXISTS "NewsletterLog_tenant" ON "NewsletterLog";
CREATE POLICY "NewsletterLog_tenant" ON "NewsletterLog"
  USING (EXISTS (
    SELECT 1 FROM "Newsletter" n WHERE n.id = "newsletterId" AND n."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM')
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Newsletter" n WHERE n.id = "newsletterId" AND n."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM');

DROP POLICY IF EXISTS "PostTag_tenant" ON "PostTag";
CREATE POLICY "PostTag_tenant" ON "PostTag"
  USING (EXISTS (
    SELECT 1 FROM "Post" p WHERE p.id = "postId" AND p."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM')
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Post" p WHERE p.id = "postId" AND p."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM');

DROP POLICY IF EXISTS "SubscriberSegment_tenant" ON "SubscriberSegment";
CREATE POLICY "SubscriberSegment_tenant" ON "SubscriberSegment"
  USING (EXISTS (
    SELECT 1 FROM "Subscriber" s WHERE s.id = "subscriberId" AND s."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM')
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Subscriber" s WHERE s.id = "subscriberId" AND s."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM');

DROP POLICY IF EXISTS "SubscriberEvent_tenant" ON "SubscriberEvent";
CREATE POLICY "SubscriberEvent_tenant" ON "SubscriberEvent"
  USING (EXISTS (
    SELECT 1 FROM "Subscriber" s WHERE s.id = "subscriberId" AND s."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM')
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Subscriber" s WHERE s.id = "subscriberId" AND s."organizationId" = app_current_org()
  ) OR app_current_role() = 'SYSTEM');

DROP POLICY IF EXISTS "OrgMembership_self" ON "OrgMembership";
CREATE POLICY "OrgMembership_self" ON "OrgMembership"
  USING ("userId" = app_current_user() OR app_current_role() = 'SYSTEM')
  WITH CHECK ("userId" = app_current_user() OR app_current_role() = 'SYSTEM');

DROP POLICY IF EXISTS "ResourceGrant_self" ON "ResourceGrant";
CREATE POLICY "ResourceGrant_self" ON "ResourceGrant"
  USING ("userId" = app_current_user() OR app_current_role() = 'SYSTEM')
  WITH CHECK ("userId" = app_current_user() OR app_current_role() = 'SYSTEM');

-- PaymentConfiguration (introduced in 30000000000100_payment_configs).
ALTER TABLE "PaymentConfiguration" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PaymentConfiguration_tenant" ON "PaymentConfiguration";
CREATE POLICY "PaymentConfiguration_tenant" ON "PaymentConfiguration"
  USING (
    "organizationId" = app_current_org()
    OR app_current_role() = 'SYSTEM'
  )
  WITH CHECK (
    "organizationId" = app_current_org()
    OR app_current_role() = 'SYSTEM'
  );
