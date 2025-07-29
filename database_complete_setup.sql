-- =====================================================
-- COMPLETE DATABASE SETUP FOR NEURATIVO
-- Perfect Authentication System with User Management
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USER MANAGEMENT TABLES
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

-- =====================================================
-- 2. SUBSCRIPTION & BILLING TABLES
-- =====================================================

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

-- =====================================================
-- 3. QUIZ MANAGEMENT TABLES
-- =====================================================

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
    is_featured BOOLEAN DEFAULT FALSE,
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

-- =====================================================
-- 4. USER ACTIVITY & PROGRESS TABLES
-- =====================================================

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

-- =====================================================
-- 5. AI & ANALYTICS TABLES
-- =====================================================

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

-- =====================================================
-- 6. ADMIN & SETTINGS TABLES
-- =====================================================

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
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Quiz indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON public.quizzes(category);
CREATE INDEX IF NOT EXISTS idx_quizzes_public ON public.quizzes(is_public);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON public.quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_quizzes_featured ON public.quizzes(is_featured);

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
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
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

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User profiles policies
CREATE POLICY "Users can view own profile data" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile data" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile data" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quizzes policies
CREATE POLICY "Anyone can view public quizzes" ON public.quizzes
    FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create quizzes" ON public.quizzes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own quizzes" ON public.quizzes
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own quizzes" ON public.quizzes
    FOR DELETE USING (auth.uid() = created_by);

-- Quiz questions policies
CREATE POLICY "Anyone can view questions for public quizzes" ON public.quiz_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quizzes 
            WHERE id = quiz_id 
            AND (is_public = true OR created_by = auth.uid())
        )
    );

CREATE POLICY "Users can manage questions for own quizzes" ON public.quiz_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quizzes 
            WHERE id = quiz_id 
            AND created_by = auth.uid()
        )
    );

-- Quiz attempts policies
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts" ON public.quiz_attempts
    FOR UPDATE USING (auth.uid() = user_id);

-- User game stats policies
CREATE POLICY "Users can view own stats" ON public.user_game_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON public.user_game_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON public.user_game_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Learning paths policies
CREATE POLICY "Users can view own learning paths" ON public.learning_paths
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own learning paths" ON public.learning_paths
    FOR ALL USING (auth.uid() = user_id);

-- AI usage logs policies
CREATE POLICY "Users can view own AI usage" ON public.ai_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI usage logs" ON public.ai_usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view own usage" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User analytics policies
CREATE POLICY "Users can view own analytics" ON public.user_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analytics" ON public.user_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System notifications policies
CREATE POLICY "Users can view own notifications" ON public.system_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.system_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 9. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_game_stats_updated_at BEFORE UPDATE ON public.user_game_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON public.learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Trigger to create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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

-- Trigger to update quiz stats
CREATE TRIGGER on_quiz_question_change
    AFTER INSERT OR DELETE ON public.quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_quiz_stats();

-- =====================================================
-- 10. INITIAL DATA
-- =====================================================

-- Insert default subscription plans
INSERT INTO public.subscription_plans (id, name, description, price, features, limits) VALUES
('free', 'Free', 'Perfect for getting started', 0.00, 
 '["Basic AI features", "Community support", "Standard templates"]',
 '{"quizzesPerDay": 5, "aiGenerations": 10, "customQuizzes": 3}'),
('pro', 'Pro', 'For serious learners', 9.99,
 '["Advanced AI features", "Priority support", "Custom templates", "Progress analytics", "Unlimited quizzes"]',
 '{"quizzesPerDay": -1, "aiGenerations": 100, "customQuizzes": -1}'),
('enterprise', 'Enterprise', 'For teams and organizations', 29.99,
 '["Everything in Pro", "Team management", "API access", "Custom integrations", "Dedicated support"]',
 '{"quizzesPerDay": -1, "aiGenerations": -1, "customQuizzes": -1}');

-- Insert default quiz categories
INSERT INTO public.quiz_categories (id, name, description, icon, color) VALUES
('programming', 'Programming', 'Learn coding and software development', 'Code', '#3B82F6'),
('web-development', 'Web Development', 'Frontend and backend web technologies', 'Globe', '#10B981'),
('database', 'Database', 'Database design and management', 'Database', '#F59E0B'),
('design', 'Design', 'UI/UX and graphic design', 'Palette', '#8B5CF6'),
('ai-ml', 'AI & ML', 'Artificial Intelligence and Machine Learning', 'Brain', '#EF4444'),
('mathematics', 'Mathematics', 'Mathematical concepts and problem solving', 'Calculator', '#06B6D4'),
('science', 'Science', 'Scientific concepts and discoveries', 'Flask', '#84CC16'),
('history', 'History', 'Historical events and figures', 'BookOpen', '#F97316'),
('language', 'Language', 'Language learning and linguistics', 'MessageSquare', '#EC4899'),
('business', 'Business', 'Business concepts and management', 'Briefcase', '#6366F1');

-- Insert admin settings
INSERT INTO public.admin_settings (key, value, description) VALUES
('ai_config', '{"active_provider": "openai", "providers": {"openai": {"enabled": true}, "claude": {"enabled": false}, "gemini": {"enabled": false}, "aimlapi": {"enabled": false}}}', 'AI service configuration'),
('site_settings', '{"maintenance_mode": false, "registration_enabled": true, "email_verification_required": false}', 'Site-wide settings'),
('feature_flags', '{"beta_features": false, "advanced_analytics": true, "social_features": true}', 'Feature flags for A/B testing');

-- =====================================================
-- 11. GRANTS & PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- COMPLETE SETUP FINISHED
-- =====================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created: users, user_profiles, subscription_plans, user_subscriptions, usage_logs, quiz_categories, quizzes, quiz_questions, quiz_attempts, user_game_stats, learning_paths, ai_usage_logs, user_analytics, admin_settings, system_notifications';
    RAISE NOTICE 'RLS policies configured for security';
    RAISE NOTICE 'Triggers and functions created for automation';
    RAISE NOTICE 'Initial data inserted (subscription plans, categories, settings)';
END $$; 