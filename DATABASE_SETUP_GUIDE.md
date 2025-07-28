# Database Setup Guide

## 🚨 **Current Issue**
The application is showing a 500 error because the database tables haven't been created yet. Here's how to fix it:

## 🔧 **Step 1: Run the Safe SQL Script**

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to SQL Editor**
3. **Copy and paste this SQL script**:

```sql
-- Safe SQL script to create missing tables and policies
-- This script uses IF NOT EXISTS and handles existing policies gracefully

-- Create QR codes table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'table', -- table, takeaway, delivery, custom
  code TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  table_number TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scan_count INTEGER NOT NULL DEFAULT 0,
  last_scanned TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('restaurant_manager', 'super_admin')),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security for new tables (safe to run multiple times)
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for QR codes (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qr_codes' AND policyname = 'Restaurant owners can manage their QR codes'
  ) THEN
    CREATE POLICY "Restaurant owners can manage their QR codes" 
    ON public.qr_codes 
    FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE id = restaurant_id AND user_id = auth.uid()
    ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qr_codes' AND policyname = 'Anyone can view active QR codes'
  ) THEN
    CREATE POLICY "Anyone can view active QR codes" 
    ON public.qr_codes 
    FOR SELECT 
    USING (is_active = true);
  END IF;
END $$;

-- Create policies for reviews (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Restaurant owners can manage their reviews'
  ) THEN
    CREATE POLICY "Restaurant owners can manage their reviews" 
    ON public.reviews 
    FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM public.restaurants 
      WHERE id = restaurant_id AND user_id = auth.uid()
    ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can view approved reviews'
  ) THEN
    CREATE POLICY "Anyone can view approved reviews" 
    ON public.reviews 
    FOR SELECT 
    USING (is_approved = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can create reviews'
  ) THEN
    CREATE POLICY "Anyone can create reviews" 
    ON public.reviews 
    FOR INSERT 
    WITH CHECK (true);
  END IF;
END $$;

-- Create policies for user_profiles (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" 
    ON public.user_profiles 
    FOR SELECT 
    USING (auth.uid() = id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" 
    ON public.user_profiles 
    FOR UPDATE 
    USING (auth.uid() = id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Super admins can view all profiles'
  ) THEN
    CREATE POLICY "Super admins can view all profiles" 
    ON public.user_profiles 
    FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    ));
  END IF;
END $$;

-- Create triggers for automatic timestamp updates (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_qr_codes_updated_at'
  ) THEN
    CREATE TRIGGER update_qr_codes_updated_at
    BEFORE UPDATE ON public.qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_reviews_updated_at'
  ) THEN
    CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Success message
SELECT 'All tables and policies created successfully!' as message;
```

4. **Click "Run"** to execute the script
5. **Wait for success message**: "All tables and policies created successfully!"

## 🔧 **Step 2: Setup Database in the App**

1. **Go to your app**: `http://localhost:8080`
2. **Login as Super Admin**: 
   - Email: `admin@restaurant.com`
   - Password: `admin123`
3. **Click "Setup Database"** button
4. **Wait for completion** and refresh the page

## ✅ **Step 3: Test User Management**

1. **Go to User Management**: `http://localhost:8080/admin/users`
2. **You should now see live data** instead of the error
3. **Try adding, editing, and deleting users**

## 🎯 **What This Fixes**

- ✅ **500 Server Error**: Tables will be created
- ✅ **User Management**: Live data will work
- ✅ **All CRUD Operations**: Add, edit, delete users
- ✅ **Restaurant Relationships**: Users linked to restaurants
- ✅ **Role Management**: Super Admin and Restaurant Manager roles

## 🚨 **If You Still See Errors**

1. **Check Supabase Dashboard** - Make sure the tables were created
2. **Refresh the app** - Clear browser cache
3. **Check console logs** - Look for any remaining errors

**After running this setup, the User Management page should work perfectly with live data!** 🎉 