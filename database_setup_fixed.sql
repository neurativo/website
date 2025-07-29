-- =====================================================
-- NEURATIVO DATABASE SETUP - FIXED VERSION
-- Complete SQL migration for user system, auth, and subscriptions
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    avatar_url TEXT,
    full_name TEXT,
    bio TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. SUBSCRIPTION PLANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    interval TEXT CHECK (interval IN ('monthly', 'yearly')) DEFAULT 'monthly',
    features JSONB NOT NULL DEFAULT '[]',
    limits JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. USER SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan_id TEXT REFERENCES public.subscription_plans(id) NOT NULL,
    status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')) DEFAULT 'active',
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, status)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. USAGE STATISTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.usage_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    quizzes_today INTEGER DEFAULT 0,
    quizzes_this_month INTEGER DEFAULT 0,
    ai_generations_used INTEGER DEFAULT 0,
    custom_quizzes_created INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    last_month_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage stats" ON public.usage_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage stats" ON public.usage_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage stats" ON public.usage_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. AI USAGE LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    feature TEXT NOT NULL,
    provider TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own AI usage logs" ON public.ai_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage logs" ON public.ai_usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 6. INSERT DEFAULT PLANS (after tables are created)
-- =====================================================

INSERT INTO public.subscription_plans (id, name, description, price, interval, features, limits, is_popular, sort_order) VALUES
(
    'free',
    'Free',
    'Perfect for getting started with AI-powered learning',
    0.00,
    'monthly',
    '["5 quizzes per day", "Basic AI quiz generation", "Standard support", "Basic analytics", "Access to quiz library", "Mobile responsive"]',
    '{"quizzesPerDay": 5, "quizzesPerMonth": 50, "aiGenerations": 10, "customQuizzes": 3, "prioritySupport": false, "advancedAnalytics": false, "exportData": false}',
    false,
    1
),
(
    'pro',
    'Pro',
    'For serious learners who want unlimited access',
    9.99,
    'monthly',
    '["Unlimited quizzes per day", "Advanced AI features", "Priority support", "Advanced analytics", "Export data", "Custom quiz creation", "Progress tracking", "Performance insights"]',
    '{"quizzesPerDay": -1, "quizzesPerMonth": -1, "aiGenerations": 100, "customQuizzes": 50, "prioritySupport": true, "advancedAnalytics": true, "exportData": true}',
    true,
    2
),
(
    'enterprise',
    'Enterprise',
    'For teams and organizations',
    29.99,
    'monthly',
    '["Everything in Pro", "Team management", "API access", "White-label options", "Dedicated support", "Custom integrations", "Advanced reporting", "SSO integration"]',
    '{"quizzesPerDay": -1, "quizzesPerMonth": -1, "aiGenerations": -1, "customQuizzes": -1, "prioritySupport": true, "advancedAnalytics": true, "exportData": true}',
    false,
    3
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    is_popular = EXCLUDED.is_popular,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- =====================================================
-- 7. UPDATE EXISTING TABLES (if they exist)
-- =====================================================

-- Update user_stats table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_stats') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_stats' AND column_name = 'total_questions') THEN
            ALTER TABLE public.user_stats ADD COLUMN total_questions INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_stats' AND column_name = 'average_score') THEN
            ALTER TABLE public.user_stats ADD COLUMN average_score DECIMAL(5,2) DEFAULT 0.00;
        END IF;
    END IF;
END $$;

-- =====================================================
-- 8. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_stats_updated_at BEFORE UPDATE ON public.usage_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset daily usage
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_reset_date != OLD.last_reset_date THEN
        NEW.quizzes_today = 0;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to reset monthly usage
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_month_reset_date != OLD.last_month_reset_date THEN
        NEW.quizzes_this_month = 0;
        NEW.ai_generations_used = 0;
        NEW.custom_quizzes_created = 0;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for usage reset
CREATE TRIGGER reset_daily_usage_trigger BEFORE UPDATE ON public.usage_stats
    FOR EACH ROW EXECUTE FUNCTION reset_daily_usage();

CREATE TRIGGER reset_monthly_usage_trigger BEFORE UPDATE ON public.usage_stats
    FOR EACH ROW EXECUTE FUNCTION reset_monthly_usage();

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON public.user_subscriptions(current_period_end);

-- Usage stats indexes
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON public.usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_last_reset ON public.usage_stats(last_reset_date);

-- AI usage logs indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature ON public.ai_usage_logs(feature);

-- =====================================================
-- 10. VIEWS FOR EASY QUERYING
-- =====================================================

-- View for user subscription details
CREATE OR REPLACE VIEW user_subscription_details AS
SELECT 
    u.id as user_id,
    u.email,
    u.username,
    us.id as subscription_id,
    us.status as subscription_status,
    sp.id as plan_id,
    sp.name as plan_name,
    sp.price as plan_price,
    sp.features as plan_features,
    sp.limits as plan_limits,
    us.current_period_start,
    us.current_period_end,
    us.cancel_at_period_end
FROM public.users u
LEFT JOIN public.user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id;

-- View for user usage summary
CREATE OR REPLACE VIEW user_usage_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.username,
    COALESCE(sp.limits->>'quizzesPerDay', '5')::integer as daily_quiz_limit,
    COALESCE(sp.limits->>'aiGenerations', '10')::integer as monthly_ai_limit,
    COALESCE(sp.limits->>'customQuizzes', '3')::integer as monthly_custom_limit,
    us.quizzes_today,
    us.quizzes_this_month,
    us.ai_generations_used,
    us.custom_quizzes_created,
    CASE 
        WHEN sp.limits->>'quizzesPerDay' = '-1' THEN -1
        ELSE COALESCE(sp.limits->>'quizzesPerDay', '5')::integer - us.quizzes_today
    END as remaining_daily_quizzes,
    CASE 
        WHEN sp.limits->>'aiGenerations' = '-1' THEN -1
        ELSE COALESCE(sp.limits->>'aiGenerations', '10')::integer - us.ai_generations_used
    END as remaining_ai_generations
FROM public.users u
LEFT JOIN public.user_subscriptions usub ON u.id = usub.user_id AND usub.status = 'active'
LEFT JOIN public.subscription_plans sp ON usub.plan_id = sp.id
LEFT JOIN public.usage_stats us ON u.id = us.user_id;

-- =====================================================
-- 11. GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.usage_stats TO authenticated;
GRANT SELECT, INSERT ON public.ai_usage_logs TO authenticated;

-- Grant permissions to views
GRANT SELECT ON user_subscription_details TO authenticated;
GRANT SELECT ON user_usage_summary TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created: users, subscription_plans, user_subscriptions, usage_stats, ai_usage_logs';
    RAISE NOTICE 'Views created: user_subscription_details, user_usage_summary';
    RAISE NOTICE 'RLS policies and triggers configured';
    RAISE NOTICE 'Default subscription plans inserted';
END $$; 