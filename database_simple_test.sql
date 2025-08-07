-- =====================================================
-- SIMPLE DATABASE TEST
-- Basic setup to verify database works
-- =====================================================

-- Test 1: Check if we can create a simple table
CREATE TABLE IF NOT EXISTS public.test_table (
    id SERIAL PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Test 2: Insert test data
INSERT INTO public.test_table (name) VALUES ('test') ON CONFLICT DO NOTHING;

-- Test 3: Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test 4: Grant permissions
GRANT ALL ON public.test_table TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- Test 5: Insert test user
INSERT INTO public.users (id, email, username) VALUES 
    ('00000000-0000-0000-0000-000000000000', 'test@test.com', 'testuser')
    ON CONFLICT (id) DO NOTHING;

-- Test 6: Verify we can query
SELECT COUNT(*) as user_count FROM public.users;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ SIMPLE TEST COMPLETED!';
    RAISE NOTICE '✅ Test table created and accessible';
    RAISE NOTICE '✅ Users table created';
    RAISE NOTICE '✅ Permissions granted';
    RAISE NOTICE '✅ Test data inserted';
    RAISE NOTICE '✅ Database is working!';
END $$; 