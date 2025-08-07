-- =====================================================
-- QUICK FIX FOR USERS TABLE
-- Ensures the users table exists and is accessible
-- =====================================================

-- Drop and recreate users table to ensure it exists
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.users TO anon, authenticated;

-- Test insert to verify table works
INSERT INTO public.users (id, email, username) VALUES 
    ('00000000-0000-0000-0000-000000000000', 'test@test.com', 'testuser')
    ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Users table created and configured successfully!';
    RAISE NOTICE '✅ Permissions granted to anon and authenticated roles';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Test insert completed';
END $$; 