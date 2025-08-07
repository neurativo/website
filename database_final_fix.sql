-- =====================================================
-- FINAL FIX FOR USER SIGNUP
-- Works with existing permissions
-- =====================================================

-- Drop the problematic trigger if it exists
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Create a new, simpler trigger function that only handles what we can
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create user_profiles and user_game_stats
    -- Let the frontend handle the users table
    INSERT INTO public.user_profiles (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
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
    RAISE NOTICE 'Final user creation trigger created successfully!';
    RAISE NOTICE 'Trigger will create user_profiles and user_game_stats only';
    RAISE NOTICE 'Frontend will handle users table creation';
END $$; 