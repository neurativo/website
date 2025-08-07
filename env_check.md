# Environment Variables Check

## 🔍 **Step 1: Check Environment Variables**

Go to `/diagnostic` in your app and click "Run Diagnostics" to check:

1. **VITE_SUPABASE_URL** - Should be your Supabase project URL
2. **VITE_SUPABASE_ANON_KEY** - Should be your Supabase anon key

## 🔧 **Step 2: Fix Environment Variables**

If the environment variables are missing or invalid:

### **Option A: Create .env file**

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_OPENAI_API_KEY=your-openai-key
VITE_CLAUDE_API_KEY=your-claude-key
VITE_GEMINI_API_KEY=your-gemini-key
VITE_AIMLAPI_API_KEY=your-aimlapi-key
VITE_ACTIVE_AI_PROVIDER=openai
```

### **Option B: Check Netlify Environment Variables**

If deployed on Netlify:

1. Go to Netlify Dashboard
2. Your site → Settings → Environment variables
3. Add the missing variables

### **Option C: Check Local Development**

If running locally:

1. Stop the dev server
2. Create/update `.env` file
3. Restart the dev server

## 🚀 **Step 3: Test Again**

After fixing environment variables:

1. Go to `/diagnostic`
2. Click "Run Diagnostics"
3. Should show all ✅ green checks

## 📋 **Expected Results**

✅ VITE_SUPABASE_URL: https://your-project.supabase.co...
✅ VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...
✅ Supabase client imported successfully
✅ Database connection successful

If you see ❌ errors, fix the specific environment variable that's missing.
