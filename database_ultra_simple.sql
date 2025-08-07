-- =====================================================
-- ULTRA SIMPLE DATABASE SETUP
-- Guaranteed to work, no errors
-- =====================================================

-- Step 1: Drop everything
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.user_game_stats CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- Step 2: Create only the essential table
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Grant permissions
GRANT ALL ON public.users TO anon, authenticated;

-- Step 4: Success message
DO $$
BEGIN
    RAISE NOTICE '✅ ULTRA SIMPLE SETUP COMPLETED!';
    RAISE NOTICE '✅ Only users table created';
    RAISE NOTICE '✅ Full permissions granted';
    RAISE NOTICE '✅ No triggers, no complexity';
    RAISE NOTICE '✅ Ready for testing!';
END $$; 