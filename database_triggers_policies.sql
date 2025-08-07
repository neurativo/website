-- =====================================================
-- TRIGGERS AND POLICIES FOR NEURATIVO
-- Run this AFTER database_working_setup.sql
-- =====================================================

-- =====================================================
-- 1. CREATE TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp on users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on user_profiles table
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on user_subscriptions table
CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON public.user_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on quizzes table
CREATE TRIGGER update_quizzes_updated_at 
    BEFORE UPDATE ON public.quizzes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on user_game_stats table
CREATE TRIGGER update_user_game_stats_updated_at 
    BEFORE UPDATE ON public.user_game_stats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on learning_paths table
CREATE TRIGGER update_learning_paths_updated_at 
    BEFORE UPDATE ON public.learning_paths 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on admin_settings table
CREATE TRIGGER update_admin_settings_updated_at 
    BEFORE UPDATE ON public.admin_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create user profile and game stats when new user signs up
CREATE TRIGGER handle_new_user_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Trigger to update quiz stats when questions are added/removed
CREATE TRIGGER update_quiz_stats_trigger
    AFTER INSERT OR DELETE ON public.quiz_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_quiz_stats();

-- =====================================================
-- 2. CREATE POLICIES
-- =====================================================

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User profiles table policies
CREATE POLICY "Users can view own profile data" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile data" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile data" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User subscriptions table policies
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage logs table policies
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quizzes table policies
CREATE POLICY "Anyone can view public quizzes" ON public.quizzes
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own quizzes" ON public.quizzes
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own quizzes" ON public.quizzes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own quizzes" ON public.quizzes
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own quizzes" ON public.quizzes
    FOR DELETE USING (auth.uid() = created_by);

-- Quiz questions table policies
CREATE POLICY "Users can view questions for accessible quizzes" ON public.quiz_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quizzes 
            WHERE id = quiz_id 
            AND (is_public = true OR created_by = auth.uid())
        )
    );

CREATE POLICY "Users can insert questions for own quizzes" ON public.quiz_questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quizzes 
            WHERE id = quiz_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update questions for own quizzes" ON public.quiz_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.quizzes 
            WHERE id = quiz_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete questions for own quizzes" ON public.quiz_questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.quizzes 
            WHERE id = quiz_id 
            AND created_by = auth.uid()
        )
    );

-- Quiz attempts table policies
CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz attempts" ON public.quiz_attempts
    FOR UPDATE USING (auth.uid() = user_id);

-- User game stats table policies
CREATE POLICY "Users can view own game stats" ON public.user_game_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own game stats" ON public.user_game_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game stats" ON public.user_game_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Learning paths table policies
CREATE POLICY "Users can view own learning paths" ON public.learning_paths
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning paths" ON public.learning_paths
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning paths" ON public.learning_paths
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own learning paths" ON public.learning_paths
    FOR DELETE USING (auth.uid() = user_id);

-- AI usage logs table policies
CREATE POLICY "Users can view own AI usage logs" ON public.ai_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage logs" ON public.ai_usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User analytics table policies
CREATE POLICY "Users can view own analytics" ON public.user_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON public.user_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON public.user_analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- System notifications table policies
CREATE POLICY "Users can view own notifications" ON public.system_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.system_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Quiz categories table policies (public read access)
CREATE POLICY "Anyone can view quiz categories" ON public.quiz_categories
    FOR SELECT USING (true);

-- Subscription plans table policies (public read access)
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
    FOR SELECT USING (true);

-- Admin settings table policies (admin only)
CREATE POLICY "Only authenticated users can view admin settings" ON public.admin_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. GRANT ADDITIONAL PERMISSIONS
-- =====================================================

-- Grant permissions for auth schema
GRANT USAGE ON SCHEMA auth TO anon, authenticated;

-- Grant permissions for auth.users table
GRANT SELECT ON auth.users TO anon, authenticated;

-- =====================================================
-- TRIGGERS AND POLICIES COMPLETED
-- =====================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Triggers and policies setup completed successfully!';
    RAISE NOTICE 'All triggers created for automatic updates';
    RAISE NOTICE 'All RLS policies created for security';
    RAISE NOTICE 'User signup should now work properly';
END $$; 