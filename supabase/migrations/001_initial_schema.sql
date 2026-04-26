-- ============================================================
--  Lumen — Schema inicial
--  Execute este arquivo no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Perfis de usuário (criado automaticamente ao registrar)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Missões completadas (devocional do dia)
CREATE TABLE IF NOT EXISTS public.mission_completions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day          INTEGER     NOT NULL,
  completed_on DATE        NOT NULL DEFAULT CURRENT_DATE,
  xp           INTEGER     NOT NULL DEFAULT 30,
  source       TEXT        NOT NULL DEFAULT 'app',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, completed_on)
);

-- 3. Progresso das lições (passo a passo)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day         INTEGER     NOT NULL,
  step        INTEGER     NOT NULL DEFAULT 0,
  total_steps INTEGER     NOT NULL DEFAULT 9,
  status      TEXT        NOT NULL DEFAULT 'in_progress'
              CHECK (status IN ('in_progress', 'done')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, day)
);

-- 4. Push subscriptions (notificações nativas)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token          TEXT        NOT NULL,
  platform       TEXT        NOT NULL DEFAULT 'web',
  reminder_time  TEXT        NOT NULL DEFAULT '08:00',
  enabled        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS (Row Level Security) ────────────────────────────────
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions  ENABLE ROW LEVEL SECURITY;

-- Profiles: só o próprio usuário lê/escreve
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Mission completions: usuário gerencia os próprios registros
CREATE POLICY "mission_completions_all_own" ON public.mission_completions
  FOR ALL USING (auth.uid() = user_id);

-- Lesson progress: usuário gerencia o próprio progresso
CREATE POLICY "lesson_progress_all_own" ON public.lesson_progress
  FOR ALL USING (auth.uid() = user_id);

-- Push subscriptions: usuário gerencia os próprios tokens
CREATE POLICY "push_subscriptions_all_own" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ── Trigger: criar perfil automaticamente ao registrar ──────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
