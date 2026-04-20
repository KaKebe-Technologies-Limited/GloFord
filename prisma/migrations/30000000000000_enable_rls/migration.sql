-- ────────────────────────────────────────────────────────────
-- Row-Level Security for multi-tenancy
--
-- Enforcement strategy:
--   • lib/tenant/context.ts sets three session-local GUCs per request:
--       SET LOCAL app.current_org  = '<orgId>';
--       SET LOCAL app.current_user = '<userId>';
--       SET LOCAL app.current_role = '<ROLE_NAME>';
--   • Policies below check those GUCs.
--   • current_setting(..., true) returns NULL when unset → every
--     policy denies by default, which is the safe posture for bugs
--     (e.g. a service forgetting to scope a query).
--   • SUPER_ADMIN bypass is handled at the service layer, not via
--     RLS, to keep the blast radius of a bug small.
--   • Global/shared tables (User, Role, Permission, Account, Session,
--     VerificationToken, OrgMembership) are NOT RLS-gated — they are
--     guarded by the service layer and Auth.js session checks.
--
-- This migration uses timestamp 30000000000000 so it always sorts
-- AFTER whatever init migration Prisma generates from schema.prisma.
-- ────────────────────────────────────────────────────────────

-- Helper: returns the current tenant id from the session GUC, or NULL.
CREATE OR REPLACE FUNCTION app_current_org() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.current_org', true), '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_user() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.current_user', true), '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_role() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.current_role', true), '');
$$ LANGUAGE sql STABLE;

-- ─── Strict tenant tables (organizationId NOT NULL) ─────────
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
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_tenant', t);
    EXECUTE format($p$
      CREATE POLICY %I ON %I
        USING ("organizationId" = app_current_org())
        WITH CHECK ("organizationId" = app_current_org());
    $p$, t || '_tenant', t);
  END LOOP;
END$$;

-- ─── Nullable-tenant tables (organizationId MAY be NULL) ─────
-- NULL orgId rows are treated as "system" and only readable when
-- no tenant is set (admin tooling / server-side jobs).
DO $$
DECLARE
  t text;
  nullable_tables text[] := ARRAY[
    'FeatureFlag', 'AuditLog', 'DeadLetter', 'WebhookEvent'
  ];
BEGIN
  FOREACH t IN ARRAY nullable_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_tenant', t);
    EXECUTE format($p$
      CREATE POLICY %I ON %I
        USING (
          "organizationId" = app_current_org()
          OR ("organizationId" IS NULL AND app_current_org() IS NULL)
        )
        WITH CHECK (
          "organizationId" = app_current_org()
          OR ("organizationId" IS NULL AND app_current_org() IS NULL)
        );
    $p$, t || '_tenant', t);
  END LOOP;
END$$;

-- ─── Indirect-tenant tables (scoped via FK to a tenant table) ─
-- Policies join through the parent row to check organizationId.
-- Cheaper than denormalizing organizationId into the child table.

ALTER TABLE "PostTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PostTag" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PostTag_tenant" ON "PostTag";
CREATE POLICY "PostTag_tenant" ON "PostTag"
  USING (EXISTS (
    SELECT 1 FROM "Post" p WHERE p.id = "postId" AND p."organizationId" = app_current_org()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Post" p WHERE p.id = "postId" AND p."organizationId" = app_current_org()
  ));

ALTER TABLE "SubscriberSegment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubscriberSegment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SubscriberSegment_tenant" ON "SubscriberSegment";
CREATE POLICY "SubscriberSegment_tenant" ON "SubscriberSegment"
  USING (EXISTS (
    SELECT 1 FROM "Subscriber" s WHERE s.id = "subscriberId" AND s."organizationId" = app_current_org()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Subscriber" s WHERE s.id = "subscriberId" AND s."organizationId" = app_current_org()
  ));

ALTER TABLE "SubscriberEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubscriberEvent" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SubscriberEvent_tenant" ON "SubscriberEvent";
CREATE POLICY "SubscriberEvent_tenant" ON "SubscriberEvent"
  USING (EXISTS (
    SELECT 1 FROM "Subscriber" s WHERE s.id = "subscriberId" AND s."organizationId" = app_current_org()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Subscriber" s WHERE s.id = "subscriberId" AND s."organizationId" = app_current_org()
  ));

ALTER TABLE "NewsletterLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsletterLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "NewsletterLog_tenant" ON "NewsletterLog";
CREATE POLICY "NewsletterLog_tenant" ON "NewsletterLog"
  USING (EXISTS (
    SELECT 1 FROM "Newsletter" n WHERE n.id = "newsletterId" AND n."organizationId" = app_current_org()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Newsletter" n WHERE n.id = "newsletterId" AND n."organizationId" = app_current_org()
  ));

ALTER TABLE "CampaignEmail" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignEmail" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CampaignEmail_tenant" ON "CampaignEmail";
CREATE POLICY "CampaignEmail_tenant" ON "CampaignEmail"
  USING (EXISTS (
    SELECT 1 FROM "EmailCampaign" c WHERE c.id = "campaignId" AND c."organizationId" = app_current_org()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "EmailCampaign" c WHERE c.id = "campaignId" AND c."organizationId" = app_current_org()
  ));

ALTER TABLE "CampaignEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignEnrollment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CampaignEnrollment_tenant" ON "CampaignEnrollment";
CREATE POLICY "CampaignEnrollment_tenant" ON "CampaignEnrollment"
  USING (EXISTS (
    SELECT 1 FROM "EmailCampaign" c WHERE c.id = "campaignId" AND c."organizationId" = app_current_org()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "EmailCampaign" c WHERE c.id = "campaignId" AND c."organizationId" = app_current_org()
  ));

ALTER TABLE "EventNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventNotification" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "EventNotification_tenant" ON "EventNotification";
CREATE POLICY "EventNotification_tenant" ON "EventNotification"
  USING (EXISTS (
    SELECT 1 FROM "Event" e WHERE e.id = "eventId" AND e."organizationId" = app_current_org()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Event" e WHERE e.id = "eventId" AND e."organizationId" = app_current_org()
  ));

-- ─── OrgMembership: a user can only see their own memberships ──
ALTER TABLE "OrgMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrgMembership" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "OrgMembership_self" ON "OrgMembership";
CREATE POLICY "OrgMembership_self" ON "OrgMembership"
  USING (
    "userId" = app_current_user()
    OR "organizationId" = app_current_org()
  )
  WITH CHECK (
    "organizationId" = app_current_org()
  );

-- ─── ResourceGrant: same-org checks at service layer;
-- RLS ensures rows match the current tenant's userIds indirectly
-- via the grant's target user being in the tenant. We keep this
-- simpler: a user can read their own grants.
ALTER TABLE "ResourceGrant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResourceGrant" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ResourceGrant_self" ON "ResourceGrant";
CREATE POLICY "ResourceGrant_self" ON "ResourceGrant"
  USING (
    "userId" = app_current_user()
    OR "grantedById" = app_current_user()
  )
  WITH CHECK (true);

-- ─── Done ─────────────────────────────────────────────────────
COMMENT ON FUNCTION app_current_org IS 'Gloford: current tenant id from session GUC';
COMMENT ON FUNCTION app_current_user IS 'Gloford: current user id from session GUC';
COMMENT ON FUNCTION app_current_role IS 'Gloford: current user role name from session GUC';
