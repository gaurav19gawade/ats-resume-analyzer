-- ============================================================
-- ATS Resume Analyzer - Initial Schema
-- ============================================================

-- Profiles table (auto-populated via trigger on auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- JD Templates table
CREATE TABLE IF NOT EXISTS public.jd_templates (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    content      TEXT NOT NULL,
    ats_platform TEXT NOT NULL DEFAULT 'unknown',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analysis history table (stores metadata only, not full resume text)
CREATE TABLE IF NOT EXISTS public.analysis_history (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_title     TEXT,
    company       TEXT,
    ats_platform  TEXT NOT NULL DEFAULT 'unknown',
    overall_score NUMERIC(3,1),
    verdict       TEXT,
    result_json   JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_jd_templates_user_id ON public.jd_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON public.analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON public.analysis_history(created_at DESC);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_jd_templates_updated_at
    BEFORE UPDATE ON public.jd_templates
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Auto-create profile on new user signup trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jd_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- JD Templates: full CRUD for own rows only
CREATE POLICY "templates_select_own" ON public.jd_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "templates_insert_own" ON public.jd_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "templates_update_own" ON public.jd_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "templates_delete_own" ON public.jd_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Analysis History: full CRUD for own rows only
CREATE POLICY "history_select_own" ON public.analysis_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "history_insert_own" ON public.analysis_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "history_delete_own" ON public.analysis_history
    FOR DELETE USING (auth.uid() = user_id);
