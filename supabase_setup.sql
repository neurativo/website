-- =====================================================
-- SUPABASE SPECIFIC SETUP
-- Additional configurations for Supabase platform
-- =====================================================

-- Enable necessary extensions for Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. SUPABASE AUTH HOOKS
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. SUPABASE STORAGE SETUP (for avatars)
-- =====================================================

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- 3. SUPABASE EDGE FUNCTIONS (if needed)
-- =====================================================

-- Function to get current user's subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID DEFAULT auth.uid())
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'user_id', u.id,
        'email', u.email,
        'username', u.username,
        'subscription', json_build_object(
            'plan_id', sp.id,
            'plan_name', sp.name,
            'status', us.status,
            'current_period_end', us.current_period_end,
            'cancel_at_period_end', us.cancel_at_period_end
        ),
        'usage', json_build_object(
            'quizzes_today', ust.quizzes_today,
            'quizzes_this_month', ust.quizzes_this_month,
            'ai_generations_used', ust.ai_generations_used,
            'custom_quizzes_created', ust.custom_quizzes_created
        ),
        'limits', sp.limits
    ) INTO result
    FROM public.users u
    LEFT JOIN public.user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
    LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
    LEFT JOIN public.usage_stats ust ON u.id = ust.user_id
    WHERE u.id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create quiz
CREATE OR REPLACE FUNCTION can_create_quiz(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    daily_limit INTEGER;
    quizzes_today INTEGER;
    plan_id TEXT;
BEGIN
    -- Get user's plan and usage
    SELECT 
        COALESCE(sp.limits->>'quizzesPerDay', '5')::integer,
        COALESCE(ust.quizzes_today, 0),
        COALESCE(sp.id, 'free')
    INTO daily_limit, quizzes_today, plan_id
    FROM public.users u
    LEFT JOIN public.user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
    LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
    LEFT JOIN public.usage_stats ust ON u.id = ust.user_id
    WHERE u.id = user_uuid;
    
    -- Unlimited plan or within daily limit
    RETURN daily_limit = -1 OR quizzes_today < daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use AI
CREATE OR REPLACE FUNCTION can_use_ai(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    monthly_limit INTEGER;
    ai_used INTEGER;
    plan_id TEXT;
BEGIN
    -- Get user's plan and usage
    SELECT 
        COALESCE(sp.limits->>'aiGenerations', '10')::integer,
        COALESCE(ust.ai_generations_used, 0),
        COALESCE(sp.id, 'free')
    INTO monthly_limit, ai_used, plan_id
    FROM public.users u
    LEFT JOIN public.user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
    LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
    LEFT JOIN public.usage_stats ust ON u.id = ust.user_id
    WHERE u.id = user_uuid;
    
    -- Unlimited plan or within monthly limit
    RETURN monthly_limit = -1 OR ai_used < monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID DEFAULT auth.uid(),
    usage_type TEXT DEFAULT 'quiz'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update usage stats based on type
    IF usage_type = 'quiz' THEN
        UPDATE public.usage_stats 
        SET 
            quizzes_today = quizzes_today + 1,
            quizzes_this_month = quizzes_this_month + 1,
            updated_at = NOW()
        WHERE user_id = user_uuid;
    ELSIF usage_type = 'ai' THEN
        UPDATE public.usage_stats 
        SET 
            ai_generations_used = ai_generations_used + 1,
            updated_at = NOW()
        WHERE user_id = user_uuid;
    ELSIF usage_type = 'custom_quiz' THEN
        UPDATE public.usage_stats 
        SET 
            custom_quizzes_created = custom_quizzes_created + 1,
            updated_at = NOW()
        WHERE user_id = user_uuid;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. SUPABASE REAL-TIME SETUP
-- =====================================================

-- Enable real-time for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_usage_logs;

-- =====================================================
-- 5. SUPABASE API PERMISSIONS
-- =====================================================

-- Grant API permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- 6. SUPABASE WEBHOOKS (Optional)
-- =====================================================

-- Function to handle subscription webhooks (for Stripe integration)
CREATE OR REPLACE FUNCTION handle_subscription_webhook()
RETURNS TRIGGER AS $$
BEGIN
    -- This function would handle webhook events from payment providers
    -- For now, it's a placeholder for future Stripe integration
    
    -- Example webhook handling:
    -- IF NEW.event_type = 'customer.subscription.updated' THEN
    --     UPDATE public.user_subscriptions 
    --     SET status = NEW.data->>'status'
    --     WHERE stripe_subscription_id = NEW.data->>'id';
    -- END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. SUPABASE CRON JOBS (for usage reset)
-- =====================================================

-- Function to reset daily usage (called by cron)
CREATE OR REPLACE FUNCTION reset_daily_usage_cron()
RETURNS void AS $$
BEGIN
    UPDATE public.usage_stats 
    SET 
        quizzes_today = 0,
        last_reset_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage (called by cron)
CREATE OR REPLACE FUNCTION reset_monthly_usage_cron()
RETURNS void AS $$
BEGIN
    UPDATE public.usage_stats 
    SET 
        quizzes_this_month = 0,
        ai_generations_used = 0,
        custom_quizzes_created = 0,
        last_month_reset_date = DATE_TRUNC('month', CURRENT_DATE),
        updated_at = NOW()
    WHERE last_month_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. SUPABASE SECURITY POLICIES
-- =====================================================

-- Additional security policies for sensitive operations
CREATE POLICY "Users can only access their own data" ON public.users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own usage stats" ON public.usage_stats
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own AI logs" ON public.ai_usage_logs
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 9. SUPABASE MONITORING VIEWS
-- =====================================================

-- View for admin monitoring
CREATE OR REPLACE VIEW admin_dashboard AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN us.status = 'active' THEN 1 END) as active_subscriptions,
    COUNT(CASE WHEN sp.id = 'pro' THEN 1 END) as pro_users,
    COUNT(CASE WHEN sp.id = 'enterprise' THEN 1 END) as enterprise_users,
    AVG(ust.quizzes_today) as avg_daily_quizzes,
    SUM(ust.ai_generations_used) as total_ai_usage
FROM public.users u
LEFT JOIN public.user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
LEFT JOIN public.usage_stats ust ON u.id = ust.user_id;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Supabase setup completed successfully!';
    RAISE NOTICE 'Auth hooks configured';
    RAISE NOTICE 'Storage buckets and policies set up';
    RAISE NOTICE 'Helper functions created';
    RAISE NOTICE 'Real-time enabled for relevant tables';
    RAISE NOTICE 'Security policies configured';
END $$; 