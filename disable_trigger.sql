-- =====================================================
-- DISABLE USER CREATION TRIGGER
-- To avoid conflicts with manual user creation
-- =====================================================

-- Disable the trigger temporarily
ALTER TABLE auth.users DISABLE TRIGGER handle_new_user_trigger;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'User creation trigger disabled successfully!';
    RAISE NOTICE 'Manual user creation will now work without conflicts';
END $$; 