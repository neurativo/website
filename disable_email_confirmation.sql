-- =====================================================
-- DISABLE EMAIL CONFIRMATION FOR DEVELOPMENT
-- Run this in Supabase SQL Editor to disable email confirmation
-- =====================================================

-- Update auth.users to mark existing users as confirmed
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Create a function to auto-confirm new users
CREATE OR REPLACE FUNCTION public.handle_new_user_auto_confirm()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-confirm the user's email
    UPDATE auth.users 
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id;
    
    -- Insert into public.users table
    INSERT INTO public.users (id, email, username, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NOW()
    );
    
    -- Create default usage stats
    INSERT INTO public.usage_stats (user_id, quizzes_today, quizzes_this_month, ai_generations_used, custom_quizzes_created)
    VALUES (NEW.id, 0, 0, 0, 0);
    
    -- Create default user_stats if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_stats') THEN
        INSERT INTO public.user_stats (user_id, total_quizzes, total_correct, total_questions, average_score, streak, xp)
        VALUES (NEW.id, 0, 0, 0, 0.00, 0, 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger with auto-confirmation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_auto_confirm();

-- =====================================================
-- MANUAL SUPABASE SETTINGS (DO THIS IN DASHBOARD)
-- =====================================================

-- IMPORTANT: You also need to manually disable email confirmation in Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Disable "Enable email confirmations"
-- 3. Save changes

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Email confirmation disabled for development!';
    RAISE NOTICE 'New users will be automatically confirmed.';
    RAISE NOTICE 'Existing unconfirmed users have been confirmed.';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Also disable email confirmation in Supabase Dashboard:';
    RAISE NOTICE '1. Go to Authentication > Settings';
    RAISE NOTICE '2. Disable "Enable email confirmations"';
    RAISE NOTICE '3. Save changes';
END $$; 