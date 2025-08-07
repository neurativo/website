-- =====================================================
-- ADD TEST USER TO DATABASE
-- For login testing
-- =====================================================

-- Step 1: Ensure users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Grant permissions
GRANT ALL ON public.users TO anon, authenticated;

-- Step 3: Add test user to auth.users (Supabase auth table)
-- Note: This creates a user in the auth system
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
    '11111111-1111-1111-1111-111111111111',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"testuser"}',
    false,
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Add test user to public.users table
INSERT INTO public.users (
    id,
    email,
    username
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'test@example.com',
    'testuser'
) ON CONFLICT (id) DO NOTHING;

-- Step 5: Verify the test user exists
SELECT 
    'Test user created successfully!' as message,
    id,
    email,
    username,
    created_at
FROM public.users 
WHERE email = 'test@example.com';

-- Step 6: Success message
DO $$
BEGIN
    RAISE NOTICE '✅ TEST USER CREATED!';
    RAISE NOTICE '✅ Email: test@example.com';
    RAISE NOTICE '✅ Password: password123';
    RAISE NOTICE '✅ Username: testuser';
    RAISE NOTICE '✅ Ready for login testing!';
END $$; 