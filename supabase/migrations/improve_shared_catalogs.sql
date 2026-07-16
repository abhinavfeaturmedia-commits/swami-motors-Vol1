-- ============================================================
-- Migration: improve_shared_catalogs
-- Purpose:   Add expiry/active controls and view tracking
--            to the shared catalogs feature
-- ============================================================

-- 1. Add is_active flag and expires_at to shared_catalogs
ALTER TABLE shared_catalogs
    ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE shared_catalogs
    ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 2. Create catalog_views table to track when customers open catalogs
CREATE TABLE IF NOT EXISTS catalog_views (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id  uuid        NOT NULL REFERENCES shared_catalogs(id) ON DELETE CASCADE,
    viewed_at   timestamptz NOT NULL DEFAULT now(),
    user_agent  text
);

-- 3. Enable Row Level Security on catalog_views
ALTER TABLE catalog_views ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Anyone can INSERT a view (public catalog page fires this)
CREATE POLICY "Public can insert catalog views"
    ON catalog_views
    FOR INSERT
    WITH CHECK (true);

-- 5. Policy: Only authenticated users (admins/staff) can SELECT views
CREATE POLICY "Authenticated users can read catalog views"
    ON catalog_views
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 6. Index for fast per-catalog view lookups
CREATE INDEX IF NOT EXISTS idx_catalog_views_catalog_id
    ON catalog_views (catalog_id);

-- 7. Index for fast is_active filtering on shared_catalogs
CREATE INDEX IF NOT EXISTS idx_shared_catalogs_is_active
    ON shared_catalogs (is_active);
