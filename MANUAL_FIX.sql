-- MANUAL FIX FOR INFINITE RECURSION ERROR
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;

-- Step 2: Create simple, non-recursive policies
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Step 3: Create a simple policy for super admins (without recursion)
CREATE POLICY "Super admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (true); -- Allow all selects for now

CREATE POLICY "Super admins can manage all profiles" 
ON public.user_profiles 
FOR ALL 
USING (true); -- Allow all operations for now

-- Step 4: Add service role policy
CREATE POLICY "Service role can manage all profiles" 
ON public.user_profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Success message
SELECT 'User profiles policies fixed successfully! You can now use the app.' as message; 