-- =============================================
-- DailyShare MVP - Initial Schema Migration
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- profiles: extends auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- public_posts: one per user per day (original requires image, quote requires quoted_post_id)
CREATE TABLE public_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('original', 'quote')),
  body TEXT CHECK (char_length(body) <= 100),
  image_url TEXT,      -- full-size (max 1080px wide)
  thumb_url TEXT,      -- thumbnail
  quoted_post_id UUID REFERENCES public_posts(id) ON DELETE SET NULL,
  post_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reported', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT one_post_per_user_per_day UNIQUE (user_id, post_date),
  CONSTRAINT original_requires_image CHECK (
    post_type != 'original' OR image_url IS NOT NULL
  ),
  CONSTRAINT quote_requires_quoted_post CHECK (
    post_type != 'quote' OR quoted_post_id IS NOT NULL
  )
);

-- private_entries: personal records (min 200 chars), visible only to owner
CREATE TABLE private_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL DEFAULT 'free' CHECK (entry_type IN ('free', 'question')),
  title TEXT,
  body TEXT NOT NULL CHECK (char_length(body) >= 200),
  question_id UUID,  -- FK added after questions table is created
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- question_categories: predefined categories
CREATE TABLE question_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- questions: belongs to a category
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES question_categories(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add FK from private_entries to questions
ALTER TABLE private_entries
  ADD CONSTRAINT private_entries_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL;

-- user_question_settings: per-user category on/off + schedule
CREATE TABLE user_question_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES question_categories(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  notify_time TIME,  -- local time for push notification
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, category_id)
);

-- daily_question_assignments: one question per user per day (stable)
CREATE TABLE daily_question_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  answered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, assigned_date)
);

-- push_tokens: stores Expo push tokens per user/device
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, token)
);

-- post_reports: minimal report system
CREATE TABLE post_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public_posts(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (reporter_id, post_id)
);

-- user_blocks: block another user
CREATE TABLE user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_public_posts_created_at ON public_posts(created_at DESC);
CREATE INDEX idx_public_posts_user_id ON public_posts(user_id);
CREATE INDEX idx_public_posts_post_date ON public_posts(post_date DESC);
CREATE INDEX idx_private_entries_user_id ON private_entries(user_id);
CREATE INDEX idx_private_entries_created_at ON private_entries(created_at DESC);
CREATE INDEX idx_daily_question_assignments_user_date ON daily_question_assignments(user_id, assigned_date);
CREATE INDEX idx_user_question_settings_user_id ON user_question_settings(user_id);
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER private_entries_updated_at
  BEFORE UPDATE ON private_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_question_settings_updated_at
  BEFORE UPDATE ON user_question_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_question_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- profiles: anyone authenticated can read; only owner can update
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- public_posts: authenticated users can read active posts (excluding blocked users)
CREATE POLICY "public_posts_select" ON public_posts
  FOR SELECT TO authenticated USING (
    status = 'active'
    AND user_id NOT IN (
      SELECT blocked_id FROM user_blocks WHERE blocker_id = auth.uid()
    )
    AND user_id NOT IN (
      SELECT blocker_id FROM user_blocks WHERE blocked_id = auth.uid()
    )
  );

CREATE POLICY "public_posts_insert" ON public_posts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "public_posts_update" ON public_posts
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "public_posts_delete" ON public_posts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- private_entries: strictly owner only
CREATE POLICY "private_entries_select" ON private_entries
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "private_entries_insert" ON private_entries
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "private_entries_update" ON private_entries
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "private_entries_delete" ON private_entries
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- question_categories & questions: read-only for all authenticated
CREATE POLICY "question_categories_select" ON question_categories
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "questions_select" ON questions
  FOR SELECT TO authenticated USING (TRUE);

-- user_question_settings: owner only
CREATE POLICY "user_question_settings_select" ON user_question_settings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user_question_settings_insert" ON user_question_settings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_question_settings_update" ON user_question_settings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user_question_settings_delete" ON user_question_settings
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- daily_question_assignments: owner only
CREATE POLICY "daily_question_assignments_select" ON daily_question_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "daily_question_assignments_insert" ON daily_question_assignments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_question_assignments_update" ON daily_question_assignments
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- push_tokens: owner only
CREATE POLICY "push_tokens_select" ON push_tokens
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "push_tokens_insert" ON push_tokens
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_tokens_update" ON push_tokens
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "push_tokens_delete" ON push_tokens
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- post_reports: reporter can insert; can read own reports
CREATE POLICY "post_reports_select" ON post_reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid());

CREATE POLICY "post_reports_insert" ON post_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

-- user_blocks: blocker can manage their own blocks
CREATE POLICY "user_blocks_select" ON user_blocks
  FOR SELECT TO authenticated USING (blocker_id = auth.uid());

CREATE POLICY "user_blocks_insert" ON user_blocks
  FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "user_blocks_delete" ON user_blocks
  FOR DELETE TO authenticated USING (blocker_id = auth.uid());

-- =============================================
-- STORAGE BUCKETS (run via Supabase dashboard or CLI)
-- =============================================
-- Create bucket: post-images (public)
-- File path convention:
--   {user_id}/{post_id}/image.jpg       <- full size
--   {user_id}/{post_id}/thumb.jpg       <- thumbnail

-- =============================================
-- SEED: Question Categories
-- =============================================

INSERT INTO question_categories (id, name, description, icon, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', '일상', '오늘 하루의 소소한 이야기', '☀️', 1),
  ('00000000-0000-0000-0000-000000000002', '감사', '감사한 것들을 기록해요', '🙏', 2),
  ('00000000-0000-0000-0000-000000000003', '목표', '꿈과 목표를 구체화해요', '🎯', 3),
  ('00000000-0000-0000-0000-000000000004', '회고', '지나온 시간을 돌아봐요', '🔍', 4),
  ('00000000-0000-0000-0000-000000000005', '관계', '사람과의 연결을 생각해요', '❤️', 5),
  ('00000000-0000-0000-0000-000000000006', '성장', '배움과 성장을 기록해요', '🌱', 6);

-- =============================================
-- SEED: Questions
-- =============================================

-- 일상
INSERT INTO questions (category_id, body, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', '오늘 가장 기억에 남는 순간은 무엇인가요? 그 순간이 특별했던 이유는 무엇인가요?', 1),
  ('00000000-0000-0000-0000-000000000001', '오늘 먹은 음식 중 가장 맛있었던 것은? 그 음식이 오늘 하루에 어떤 의미를 가졌나요?', 2),
  ('00000000-0000-0000-0000-000000000001', '오늘 대화한 사람들 중 가장 인상 깊었던 대화는 무엇인가요?', 3),
  ('00000000-0000-0000-0000-000000000001', '오늘 하루 동안 몸과 마음의 컨디션은 어땠나요? 이유는 무엇이라고 생각하나요?', 4),
  ('00000000-0000-0000-0000-000000000001', '오늘 나를 미소 짓게 만든 것은 무엇인가요?', 5);

-- 감사
INSERT INTO questions (category_id, body, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000002', '오늘 감사한 일 세 가지를 떠올리고, 그 이유를 자세히 적어보세요.', 1),
  ('00000000-0000-0000-0000-000000000002', '내 삶에서 당연하게 여겼지만 사실 감사해야 할 것들은 무엇인가요?', 2),
  ('00000000-0000-0000-0000-000000000002', '최근 나에게 도움을 준 사람은 누구인가요? 그 도움이 어떤 의미였는지 적어보세요.', 3),
  ('00000000-0000-0000-0000-000000000002', '힘든 상황 속에서도 감사할 수 있는 점을 찾아본다면 무엇일까요?', 4);

-- 목표
INSERT INTO questions (category_id, body, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000003', '올해 꼭 이루고 싶은 목표는 무엇인가요? 왜 그 목표가 중요한가요?', 1),
  ('00000000-0000-0000-0000-000000000003', '지금 가장 집중하고 있는 목표를 향해 오늘 어떤 행동을 했나요?', 2),
  ('00000000-0000-0000-0000-000000000003', '5년 후의 나는 어떤 모습이길 바라나요? 그 모습을 위해 지금 무엇을 해야 할까요?', 3),
  ('00000000-0000-0000-0000-000000000003', '목표 달성을 방해하는 가장 큰 장애물은 무엇이고, 어떻게 극복할 수 있을까요?', 4);

-- 회고
INSERT INTO questions (category_id, body, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000004', '이번 주 가장 잘 한 일과 더 잘 할 수 있었던 일은 무엇인가요?', 1),
  ('00000000-0000-0000-0000-000000000004', '최근 한 달 동안 나에게 일어난 가장 큰 변화는 무엇인가요?', 2),
  ('00000000-0000-0000-0000-000000000004', '과거의 내가 지금의 나를 본다면 어떻게 생각할까요?', 3),
  ('00000000-0000-0000-0000-000000000004', '실수나 실패에서 배운 가장 소중한 교훈은 무엇인가요?', 4);

-- 관계
INSERT INTO questions (category_id, body, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000005', '내 삶에서 가장 소중한 사람은 누구이고, 그 이유는 무엇인가요?', 1),
  ('00000000-0000-0000-0000-000000000005', '최근 소홀했던 관계가 있나요? 그 관계를 개선하기 위해 무엇을 할 수 있을까요?', 2),
  ('00000000-0000-0000-0000-000000000005', '나는 어떤 사람이 되고 싶은가요? 주변 사람들에게 어떻게 기억되길 원하나요?', 3),
  ('00000000-0000-0000-0000-000000000005', '갈등 상황에서 나는 어떻게 반응하는 편인가요? 더 나은 방식이 있을까요?', 4);

-- 성장
INSERT INTO questions (category_id, body, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000006', '최근 새롭게 배운 것은 무엇인가요? 그것이 삶에 어떤 영향을 주었나요?', 1),
  ('00000000-0000-0000-0000-000000000006', '내가 가진 강점은 무엇이고, 그 강점을 어떻게 더 발전시킬 수 있을까요?', 2),
  ('00000000-0000-0000-0000-000000000006', '지금 불편함을 느끼는 영역은 어디인가요? 그 불편함이 성장의 신호일 수 있을까요?', 3),
  ('00000000-0000-0000-0000-000000000006', '6개월 전과 비교했을 때 어떤 부분에서 성장했나요?', 4);
