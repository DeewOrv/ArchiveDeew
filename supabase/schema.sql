-- ArchiveDeew — Supabase Database Schema
-- Paste this entire file into Supabase SQL Editor and click Run.

-- ============================================================
-- 1. MEDIA TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  alternative_title TEXT,
  acronym       TEXT,
  cover_url     TEXT,
  category      TEXT NOT NULL DEFAULT 'Anime',
  media_status  TEXT DEFAULT 'Ongoing',
  progress      INTEGER DEFAULT 0,
  my_status     TEXT DEFAULT 'Not Started',
  last_source   TEXT,
  favorite      BOOLEAN DEFAULT FALSE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for import/upsert deduplication
ALTER TABLE public.media
  DROP CONSTRAINT IF EXISTS media_user_title_category_unique;
ALTER TABLE public.media
  ADD CONSTRAINT media_user_title_category_unique
  UNIQUE (user_id, title, category);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_media_user_id
  ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_updated_at
  ON public.media(user_id, updated_at DESC);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own media" ON public.media;
DROP POLICY IF EXISTS "Users insert own media" ON public.media;
DROP POLICY IF EXISTS "Users update own media" ON public.media;
DROP POLICY IF EXISTS "Users delete own media" ON public.media;

CREATE POLICY "Users select own media"
  ON public.media FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own media"
  ON public.media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own media"
  ON public.media FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own media"
  ON public.media FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. STORAGE POLICIES (covers bucket)
-- Run this ONLY after creating the 'covers' bucket in the
-- Supabase Dashboard → Storage → New Bucket (set Public: on).
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can read covers" ON storage.objects;

-- Any authenticated user may upload (insert) a cover image.
CREATE POLICY "Authenticated users can upload covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'covers');

-- Anyone (including unauthenticated) may read cover images
-- so that <img> tags work without extra auth headers.
CREATE POLICY "Public can read covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

-- NOTE: No UPDATE or DELETE storage policies are defined.
-- Cover uploads use upsert: true on the insert path.
-- Deleting old covers is handled by uploading a new one
-- (the app does not expose a delete-cover operation).
