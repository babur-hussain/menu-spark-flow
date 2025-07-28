# Fix Profile Update Error

## 🚨 **Current Issue**

The "Edit Profile" modal is showing "Failed to update profile" error because the `user_profiles` table is missing the required columns (`first_name`, `last_name`, `display_name`, `phone`).

## 🔧 **Step 1: Fix Database Schema**

**Run this SQL script in your Supabase Dashboard:**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Click "SQL Editor"**
3. **Copy and paste this SQL script**:

```sql
-- Fix user_profiles table schema to add missing columns
-- Run this in your Supabase SQL Editor

-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update existing user_profiles to have default values
UPDATE public.user_profiles 
SET 
  first_name = COALESCE(first_name, ''),
  last_name = COALESCE(last_name, ''),
  display_name = COALESCE(display_name, ''),
  phone = COALESCE(phone, ''),
  avatar_url = COALESCE(avatar_url, '')
WHERE first_name IS NULL OR last_name IS NULL OR display_name IS NULL OR phone IS NULL OR avatar_url IS NULL;

-- Success message
SELECT 'User profiles table schema updated successfully!' as message;
```

4. **Click "Run"** to execute the script
5. **Wait for success message**: "User profiles table schema updated successfully!"

## 🔧 **Step 2: Test Profile Update**

After running the SQL fix:

1. **Go to your app**: `http://localhost:8080`
2. **Login as any user** (restaurant manager or super admin)
3. **Click "Profile Settings"** button in the header
4. **Fill in your details**:
   - First Name: Your first name
   - Last Name: Your last name
   - Display Name: How you want to be shown
   - Phone Number: Your phone number
5. **Click "Save Changes"**
6. **Should work without errors**

## ✅ **What This Fixes**

- ✅ **Profile Update Error**: No more "Failed to update profile"
- ✅ **Missing Columns**: Adds required columns to user_profiles table
- ✅ **User Names**: Shows real names instead of "John Doe"
- ✅ **Profile Management**: Full profile editing functionality
- ✅ **Display Names**: Custom display names work properly

## 🎯 **Expected Result**

After running the SQL fix:

- ✅ **Profile Settings button** works without errors
- ✅ **Real names** appear in the header instead of "John Doe"
- ✅ **Profile updates** save successfully
- ✅ **Display names** show properly throughout the app
- ✅ **No more 400/406 errors** in the console

## 🚨 **If You Still See Errors**

### **Check Console for Schema Errors**
If you see `42703` errors, it means the schema update didn't work:

1. **Check Supabase Dashboard** - Make sure the SQL ran successfully
2. **Verify Table Structure** - Check if columns were added
3. **Re-run the SQL** - Try the script again

### **Alternative: Manual Column Addition**
If the script doesn't work, add columns manually:

```sql
-- Add columns one by one
ALTER TABLE public.user_profiles ADD COLUMN first_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN last_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN display_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN phone TEXT;
ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
```

## 🎉 **After the Fix**

**Your profile management will work perfectly:**

- ✅ **Edit Profile** - Set your real name and details
- ✅ **Display Names** - Show proper names throughout the app
- ✅ **No More Errors** - Profile updates work smoothly
- ✅ **User Experience** - Professional user interface

**The profile update error will be completely resolved!** 🚀 