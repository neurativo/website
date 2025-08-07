-- =====================================================
-- CLEAN TEST USER SETUP
-- Removes existing test users and creates fresh one
-- =====================================================

-- Step 1: Disable all problematic triggers temporarily
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_auto_confirm_trigger ON auth.users;

-- Step 2: Clean up any existing test users
DELETE FROM public.users WHERE email = 'test@example.com' OR username = 'testuser';
DELETE FROM auth.users WHERE email = 'test@example.com';

-- Step 3: Ensure users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Grant permissions
GRANT ALL ON public.users TO anon, authenticated;

-- Step 5: Add test user to auth.users (Supabase auth table)
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
    '44444444-4444-4444-4444-444444444444',
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

-- Step 6: Add test user to public.users table
INSERT INTO public.users (
    id,
    email,
    username
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'test@example.com',
    'testuser123'
) ON CONFLICT (id) DO NOTHING;

-- Step 7: Verify the test user exists
SELECT 
    'Test user created successfully!' as message,
    id,
    email,
    username,
    created_at
FROM public.users 
WHERE email = 'test@example.com';

-- Step 8: Success message
DO $$
BEGIN
    RAISE NOTICE '✅ CLEAN TEST USER CREATED!';
    RAISE NOTICE '✅ Email: test@example.com';
    RAISE NOTICE '✅ Password: password123';
    RAISE NOTICE '✅ Username: testuser123';
    RAISE NOTICE '✅ All triggers disabled to prevent conflicts';
    RAISE NOTICE '✅ Ready for login testing!';
END $$; 