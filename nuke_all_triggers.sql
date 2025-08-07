-- =====================================================
-- NUKE ALL TRIGGERS AND FUNCTIONS
-- Completely removes all problematic database objects
-- =====================================================

-- Step 1: Drop ALL triggers that might cause issues
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_auto_confirm_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_auto_confirm ON auth.users;

-- Step 2: Drop ALL functions that might cause issues
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_auto_confirm();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_new_user_auto_confirm();

-- Step 3: Clean up any existing test users
DELETE FROM public.users WHERE email = 'test@example.com' OR username LIKE 'testuser%';
DELETE FROM auth.users WHERE email = 'test@example.com';
DELETE FROM public.user_stats WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'test@example.com'
);

-- Step 4: Ensure users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Ensure user_stats table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    total_quizzes INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,
    achievements TEXT[] DEFAULT '{}',
    last_quiz_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Grant permissions
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.user_stats TO anon, authenticated;

-- Step 7: Add test user to auth.users (Supabase auth table)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"testuser123"}',
    false,
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Step 8: Add test user to public.users table
INSERT INTO public.users (
    id,
    email,
    username
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    'test@example.com',
    'testuser123'
) ON CONFLICT (id) DO NOTHING;

-- Step 9: Add test user stats
INSERT INTO public.user_stats (
    user_id,
    total_xp,
    current_level,
    current_streak,
    best_streak,
    total_quizzes,
    total_correct,
    total_questions,
    total_time_spent,
    achievements
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    '{}'
) ON CONFLICT (user_id) DO NOTHING;

-- Step 10: Verify the test user exists
SELECT 
    'Test user created successfully!' as message,
    u.id,
    u.email,
    u.username,
    u.created_at,
    s.total_xp,
    s.current_level
FROM public.users u
LEFT JOIN public.user_stats s ON u.id = s.user_id
WHERE u.email = 'test@example.com';

-- Step 11: Success message
DO $$
BEGIN
    RAISE NOTICE '✅ ALL TRIGGERS AND FUNCTIONS NUKE COMPLETED!';
    RAISE NOTICE '✅ All problematic triggers dropped';
    RAISE NOTICE '✅ All problematic functions dropped';
    RAISE NOTICE '✅ Test user created successfully';
    RAISE NOTICE '✅ Email: test@example.com';
    RAISE NOTICE '✅ Password: password123';
    RAISE NOTICE '✅ Username: testuser123';
    RAISE NOTICE '✅ Ready for login testing!';
END $$; 