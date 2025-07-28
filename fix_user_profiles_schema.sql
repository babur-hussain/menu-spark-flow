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