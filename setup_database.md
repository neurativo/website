# 🗄️ Database Setup Instructions

## 📋 Prerequisites

- Supabase project created
- Access to Supabase SQL Editor
- Database admin privileges

## 🚀 Quick Setup

### Step 1: Run Main Database Setup

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `database_setup.sql`
5. Click **Run** to execute

### Step 2: Run Supabase-Specific Setup

1. Create another new query in SQL Editor
2. Copy and paste the contents of `supabase_setup.sql`
3. Click **Run** to execute

## 📊 What Gets Created

### Tables

- ✅ `users` - User profiles and preferences
- ✅ `subscription_plans` - Available pricing plans
- ✅ `user_subscriptions` - User subscription status
- ✅ `usage_stats` - Daily/monthly usage tracking
- ✅ `ai_usage_logs` - AI feature usage logs

### Views

- ✅ `user_subscription_details` - Complete user subscription info
- ✅ `user_usage_summary` - Usage limits and remaining quotas
- ✅ `admin_dashboard` - Admin monitoring view

### Functions

- ✅ `handle_new_user()` - Auto-creates user profile on signup
- ✅ `get_user_subscription_status()` - Get user's plan and usage
- ✅ `can_create_quiz()` - Check if user can create quiz
- ✅ `can_use_ai()` - Check if user can use AI features
- ✅ `increment_usage()` - Track feature usage

### Security

- ✅ Row Level Security (RLS) enabled
- ✅ Proper access policies configured
- ✅ Secure authentication integration

## 🔧 Manual Verification

### Check Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'subscription_plans', 'user_subscriptions', 'usage_stats', 'ai_usage_logs');
```

### Check Default Plans

```sql
SELECT id, name, price, interval
FROM subscription_plans
ORDER BY sort_order;
```

### Check Functions

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%' OR routine_name LIKE '%usage%';
```

## 🎯 Default Plans Created

| Plan       | Price  | Quizzes/Day | AI Generations | Custom Quizzes |
| ---------- | ------ | ----------- | -------------- | -------------- |
| Free       | $0     | 5           | 10             | 3              |
| Pro        | $9.99  | Unlimited   | 100            | 50             |
| Enterprise | $29.99 | Unlimited   | Unlimited      | Unlimited      |

## 🔐 Security Features

- **Row Level Security**: Users can only access their own data
- **Authentication Integration**: Automatic user profile creation
- **Usage Limits**: Enforced daily/monthly quotas
- **Audit Logging**: AI usage tracking for billing

## 🚨 Troubleshooting

### Common Issues

1. **"Permission denied" errors**

   - Ensure you're logged in as a database admin
   - Check that RLS policies are correctly configured

2. **"Table already exists" errors**

   - The script uses `IF NOT EXISTS` so this shouldn't happen
   - If it does, the table structure is already correct

3. **"Function already exists" errors**
   - Functions are created with `OR REPLACE` so they'll be updated
   - This is normal and expected

### Reset Everything (DANGER!)

```sql
-- Only run this if you want to start completely fresh
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## 📈 Next Steps

After running the setup:

1. **Test Authentication**: Try creating a new user account
2. **Verify Usage Tracking**: Check that usage stats are created
3. **Test Subscription**: Verify plan limits are working
4. **Monitor Logs**: Check AI usage logs are being created

## 🔗 Integration

The database is now ready for:

- ✅ User authentication and profiles
- ✅ Subscription management
- ✅ Usage tracking and limits
- ✅ AI feature billing
- ✅ Admin monitoring

Your Neurativo app should now work with full user management and subscription features! 🎉
