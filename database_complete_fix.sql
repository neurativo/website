-- =====================================================
-- COMPLETE DATABASE FIX
-- Works with all permission levels
-- =====================================================

-- Step 1: Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bio TEXT,
    location TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_game_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.subscription_plans (
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

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES subscription_plans(id),
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_stats_user_id ON public.user_game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Step 3: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies
-- Users can view and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Users can view and update their own profile data
DROP POLICY IF EXISTS "Users can view own profile data" ON public.user_profiles;
CREATE POLICY "Users can view own profile data" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Users can view and update their own game stats
DROP POLICY IF EXISTS "Users can view own game stats" ON public.user_game_stats;
CREATE POLICY "Users can view own game stats" ON public.user_game_stats
    FOR ALL USING (auth.uid() = user_id);

-- Everyone can view subscription plans
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
    FOR SELECT USING (true);

-- Users can view their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Step 5: Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.user_profiles (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
    -- Create user game stats
    INSERT INTO public.user_game_stats (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
    -- Create default subscription (free plan)
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, created_at, updated_at)
    VALUES (NEW.id, 'free', 'active', NOW(), NOW());
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
CREATE TRIGGER handle_new_user_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Insert default subscription plans
INSERT INTO public.subscription_plans (id, name, description, price, daily_quizzes, ai_generations, custom_quizzes, features) VALUES
    ('free', 'Free', 'Basic plan with limited features', 0.00, 5, 10, 3, '["Basic quizzes", "Limited AI generations"]')
    ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscription_plans (id, name, description, price, daily_quizzes, ai_generations, custom_quizzes, features) VALUES
    ('pro', 'Pro', 'Advanced features for serious learners', 9.99, 50, 100, 20, '["Unlimited quizzes", "Advanced AI", "Custom quizzes", "Analytics"]')
    ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscription_plans (id, name, description, price, daily_quizzes, ai_generations, custom_quizzes, features) VALUES
    ('enterprise', 'Enterprise', 'Complete solution for teams', 29.99, 1000, 1000, 100, '["Team management", "Advanced analytics", "Priority support", "Custom integrations"]')
    ON CONFLICT (id) DO NOTHING;

-- Step 8: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.user_game_stats TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.user_subscriptions TO anon, authenticated;

-- Step 9: Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '✅ All tables created with proper permissions';
    RAISE NOTICE '✅ Trigger configured for automatic profile creation';
    RAISE NOTICE '✅ Default subscription plans inserted';
    RAISE NOTICE '✅ Ready for user signup!';
END $$; 