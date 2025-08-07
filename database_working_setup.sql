-- =====================================================
-- WORKING DATABASE SETUP FOR NEURATIVO
-- Only uses IF NOT EXISTS for tables and indexes
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles for additional data
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    learning_goals TEXT[],
    preferred_topics TEXT[],
    study_schedule JSONB,
    achievements JSONB DEFAULT '[]',
    badges JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT DEFAULT 'monthly',
    features JSONB NOT NULL,
    limits JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES public.subscription_plans(id),
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    usage_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz categories
CREATE TABLE IF NOT EXISTS public.quiz_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT REFERENCES public.quiz_categories(id),
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    questions_count INTEGER DEFAULT 0,
    estimated_time INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    type TEXT CHECK (type IN ('multiple_choice', 'true_false', 'short_answer')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    topic TEXT,
    time_limit INTEGER DEFAULT 30,
    hints TEXT[],
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    score DECIMAL(5,2),
    correct_answers INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    time_taken INTEGER DEFAULT 0,
    answers JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User game stats
CREATE TABLE IF NOT EXISTS public.user_game_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    total_quizzes INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,
    achievements JSONB DEFAULT '[]',
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning paths
CREATE TABLE IF NOT EXISTS public.learning_paths (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    goals TEXT[],
    topics TEXT[],
    progress JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI usage logs
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    provider TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User analytics
CREATE TABLE IF NOT EXISTS public.user_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    quizzes_taken INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    topics_studied TEXT[],
    weak_areas JSONB DEFAULT '[]',
    strong_areas JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System notifications
CREATE TABLE IF NOT EXISTS public.system_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Quiz indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON public.quizzes(category);
CREATE INDEX IF NOT EXISTS idx_quizzes_public ON public.quizzes(is_public);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON public.quizzes(created_by);

-- Quiz questions indexes
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_type ON public.quiz_questions(type);

-- Quiz attempts indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON public.quiz_attempts(completed_at);

-- Usage logs indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_date ON public.usage_logs(usage_date);

-- AI usage indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage_logs(created_at);

-- =====================================================
-- 3. ENABLE RLS
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id)
    VALUES (NEW.id);
    
    INSERT INTO public.user_game_stats (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update quiz stats
CREATE OR REPLACE FUNCTION update_quiz_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update quiz questions count
    UPDATE public.quizzes 
    SET questions_count = (
        SELECT COUNT(*) FROM public.quiz_questions 
        WHERE quiz_id = NEW.quiz_id
    )
    WHERE id = NEW.quiz_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 5. INSERT INITIAL DATA (WITH CONFLICT HANDLING)
-- =====================================================

-- Insert default subscription plans (ignore if already exist)
INSERT INTO public.subscription_plans (id, name, description, price, features, limits) VALUES
('free', 'Free', 'Perfect for getting started', 0.00, 
 '["Basic AI features", "Community support", "Standard templates"]',
 '{"quizzesPerDay": 5, "aiGenerations": 10, "customQuizzes": 3}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscription_plans (id, name, description, price, features, limits) VALUES
('pro', 'Pro', 'For serious learners', 9.99,
 '["Advanced AI features", "Priority support", "Custom templates", "Progress analytics", "Unlimited quizzes"]',
 '{"quizzesPerDay": -1, "aiGenerations": 100, "customQuizzes": -1}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscription_plans (id, name, description, price, features, limits) VALUES
('enterprise', 'Enterprise', 'For teams and organizations', 29.99,
 '["Everything in Pro", "Team management", "API access", "Custom integrations", "Dedicated support"]',
 '{"quizzesPerDay": -1, "aiGenerations": -1, "customQuizzes": -1}')
ON CONFLICT (id) DO NOTHING;

-- Insert default quiz categories (ignore if already exist)
INSERT INTO public.quiz_categories (id, name, description, icon, color) VALUES
('programming', 'Programming', 'Learn coding and software development', 'Code', '#3B82F6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_categories (id, name, description, icon, color) VALUES
('web-development', 'Web Development', 'Frontend and backend web technologies', 'Globe', '#10B981')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_categories (id, name, description, icon, color) VALUES
('database', 'Database', 'Database design and management', 'Database', '#F59E0B')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_categories (id, name, description, icon, color) VALUES
('design', 'Design', 'UI/UX and graphic design', 'Palette', '#8B5CF6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_categories (id, name, description, icon, color) VALUES
('ai-ml', 'AI & ML', 'Artificial Intelligence and Machine Learning', 'Brain', '#EF4444')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_categories (id, name, description, icon, color) VALUES
('mathematics', 'Mathematics', 'Mathematical concepts and problem solving', 'Calculator', '#06B6D4')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_categories (id, name, description, icon, color) VALUES
('science', 'Science', 'Scientific concepts and discoveries', 'Flask', '#84CC16')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_categories (id, name, description, icon, color) VALUES
('history', 'History', 'Historical events and figures', 'BookOpen', '#F97316')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_categories (id, name, description, icon, color) VALUES
('language', 'Language', 'Language learning and linguistics', 'MessageSquare', '#EC4899')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_categories (id, name, description, icon, color) VALUES
('business', 'Business', 'Business concepts and management', 'Briefcase', '#6366F1')
ON CONFLICT (id) DO NOTHING;

-- Insert admin settings (ignore if already exist)
INSERT INTO public.admin_settings (key, value, description) VALUES
('ai_config', '{"active_provider": "openai", "providers": {"openai": {"enabled": true}, "claude": {"enabled": false}, "gemini": {"enabled": false}, "aimlapi": {"enabled": false}}}', 'AI service configuration')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_settings (key, value, description) VALUES
('site_settings', '{"maintenance_mode": false, "registration_enabled": true, "email_verification_required": false}', 'Site-wide settings')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_settings (key, value, description) VALUES
('feature_flags', '{"beta_features": false, "advanced_analytics": true, "social_features": true}', 'Feature flags for A/B testing')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 6. GRANTS & PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- WORKING SETUP COMPLETED
-- =====================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Working database setup completed successfully!';
    RAISE NOTICE 'All tables created with IF NOT EXISTS';
    RAISE NOTICE 'All indexes created with IF NOT EXISTS';
    RAISE NOTICE 'All functions created';
    RAISE NOTICE 'RLS enabled on all tables';
    RAISE NOTICE 'Initial data inserted with conflict handling';
    RAISE NOTICE 'You can now add triggers and policies manually';
END $$;