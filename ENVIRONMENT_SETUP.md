# Environment Setup Guide

## 🚨 **Current Issue: Missing Supabase Environment Variables**

Your application is showing a blank white screen because it cannot connect to Supabase without the required environment variables.

## 🔧 **Quick Fix: Create .env File**

1. **Create a `.env` file** in your project root directory (same level as `package.json`)

2. **Add these variables** to your `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 📍 **How to Get Your Supabase Credentials**

### **Step 1: Go to Supabase Dashboard**
1. Visit [supabase.com](https://supabase.com)
2. Sign in to your account
3. Open your project dashboard

### **Step 2: Find Your Project URL**
1. In the left sidebar, click **"Settings"**
2. Click **"API"**
3. Copy the **"Project URL"** - it looks like: `https://abcdefghijklmnop.supabase.co`

### **Step 3: Find Your Anon Key**
1. In the same API settings page
2. Copy the **"anon public"** key - it's a long string starting with `eyJ...`

### **Step 4: Update Your .env File**
Replace the placeholder values with your actual credentials:

```bash
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU2NzIwMCwiZXhwIjoxOTUyMTQzMjAwfQ.example_signature
```

## 🚀 **After Setting Up Environment Variables**

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **The application should now load properly** instead of showing a blank white screen

## 📋 **Complete Setup Checklist**

- [ ] Create `.env` file in project root
- [ ] Add `VITE_SUPABASE_URL` with your project URL
- [ ] Add `VITE_SUPABASE_ANON_KEY` with your anon key
- [ ] Restart development server
- [ ] Verify application loads without blank screen

## 🔒 **Security Note**

- **Never commit your `.env` file** to version control
- The `.env` file is already in `.gitignore` to prevent accidental commits
- Keep your Supabase keys secure and private

## 🆘 **Still Having Issues?**

If you continue to see a blank white screen after setting up the environment variables:

1. Check the browser console for any new error messages
2. Verify your Supabase project is active and accessible
3. Ensure you copied the credentials correctly (no extra spaces or characters)
4. Try refreshing the page after restarting the server
