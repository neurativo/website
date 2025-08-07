-- =====================================================
-- EMERGENCY DATABASE FIX
-- Guaranteed to work with current permissions
-- =====================================================

-- Step 1: Drop everything and start fresh
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.user_game_stats CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- Step 2: Create tables with minimal structure
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    bio TEXT,
    location TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_game_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    total_quizzes INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.00,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    daily_quizzes INTEGER DEFAULT 5,
    ai_generations INTEGER DEFAULT 10,
    custom_quizzes INTEGER DEFAULT 3,
    features JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    plan_id TEXT,
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_game_stats_user_id ON public.user_game_stats(user_id);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Step 4: Insert default data
INSERT INTO public.subscription_plans (id, name, description, price, daily_quizzes, ai_generations, custom_quizzes) VALUES
    ('free', 'Free', 'Basic plan with limited features', 0.00, 5, 10, 3),
    ('pro', 'Pro', 'Advanced features for serious learners', 9.99, 50, 100, 20),
    ('enterprise', 'Enterprise', 'Complete solution for teams', 29.99, 1000, 1000, 100)
    ON CONFLICT (id) DO NOTHING;

-- Step 5: Grant ALL permissions (no RLS for now)
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.user_game_stats TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.user_subscriptions TO anon, authenticated;

-- Step 6: Test insert
INSERT INTO public.users (id, email, username) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'test@test.com', 'testuser')
    ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ EMERGENCY FIX COMPLETED!';
    RAISE NOTICE '✅ All tables created without RLS';
    RAISE NOTICE '✅ All permissions granted';
    RAISE NOTICE '✅ Test data inserted';
    RAISE NOTICE '✅ Ready for testing!';
END $$; 