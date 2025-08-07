-- =====================================================
-- DATABASE DEBUG TEST
-- Step-by-step debugging to find the exact issue
-- =====================================================

-- Step 1: Check if we can create a table
DO $$
BEGIN
    RAISE NOTICE 'Step 1: Testing table creation...';
END $$;

CREATE TABLE IF NOT EXISTS public.debug_test (
    id SERIAL PRIMARY KEY,
    test_value TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Check if we can insert data
DO $$
BEGIN
    RAISE NOTICE 'Step 2: Testing data insertion...';
END $$;

INSERT INTO public.debug_test (test_value) VALUES ('test') ON CONFLICT DO NOTHING;

-- Step 3: Check if we can query data
DO $$
BEGIN
    RAISE NOTICE 'Step 3: Testing data query...';
END $$;

SELECT COUNT(*) as debug_count FROM public.debug_test;

-- Step 4: Check users table
DO $$
BEGIN
    RAISE NOTICE 'Step 4: Checking users table...';
END $$;

-- Check if users table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) as users_table_exists;

-- Step 5: Check users table structure
DO $$
BEGIN
    RAISE NOTICE 'Step 5: Checking users table structure...';
END $$;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 6: Check permissions
DO $$
BEGIN
    RAISE NOTICE 'Step 6: Checking permissions...';
END $$;

SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- Step 7: Test users table insert
DO $$
BEGIN
    RAISE NOTICE 'Step 7: Testing users table insert...';
END $$;

-- Try to insert a test user
INSERT INTO public.users (id, email, username) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'debug@test.com', 'debuguser')
    ON CONFLICT (id) DO NOTHING;

-- Step 8: Check if insert worked
DO $$
BEGIN
    RAISE NOTICE 'Step 8: Checking if insert worked...';
END $$;

SELECT COUNT(*) as user_count FROM public.users;

-- Step 9: Check for any errors
DO $$
BEGIN
    RAISE NOTICE 'Step 9: Debug test completed!';
    RAISE NOTICE 'Check the results above for any issues.';
END $$; 