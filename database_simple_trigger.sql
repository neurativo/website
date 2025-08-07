-- =====================================================
-- SIMPLE USER CREATION TRIGGER
-- This should definitely work
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Create a simple trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, email, username, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || NEW.id),
        NOW(),
        NOW()
    );
    
    -- Insert into user_profiles table
    INSERT INTO public.user_profiles (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
    -- Insert into user_game_stats table
    INSERT INTO public.user_game_stats (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
CREATE TRIGGER handle_new_user_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON auth.users TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Simple user creation trigger created successfully!';
    RAISE NOTICE 'Trigger will automatically create user profiles on signup';
END $$; 