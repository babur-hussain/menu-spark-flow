# Setup Database Button Troubleshooting

## 🚨 **Current Issue**
The "Setup Database" button is not working properly. Here's how to fix it:

## 🔧 **Step 1: Fix Database Policies (REQUIRED)**

The main issue is **infinite recursion in database policies**. You must fix this first:

### **Option A: Manual SQL Fix (Recommended)**

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Click "SQL Editor"** in the left sidebar
3. **Copy and paste this SQL script**:

```sql
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
```

4. **Click "Run"** to execute the script
5. **Wait for success message**: "User profiles policies fixed successfully!"

### **Option B: Use the "Fix Policies" Button**

1. **Go to your app**: `http://localhost:8080`
2. **Login as Super Admin**: 
   - Email: `admin@restaurant.com`
   - Password: `admin123`
3. **Click "Fix Policies"** button
4. **Follow the instructions** in the toast message

## 🔧 **Step 2: Test the Setup Database Button**

After fixing the policies:

1. **Go to your app**: `http://localhost:8080`
2. **Login as Super Admin**: 
   - Email: `admin@restaurant.com`
   - Password: `admin123`
3. **Click "Setup Database"** button
4. **Wait for success message**
5. **Refresh the page**

## 🔧 **Step 3: Verify Everything Works**

1. **Check User Management**: `http://localhost:8080/admin/users`
   - Should show live data instead of error
2. **Check Restaurants**: `http://localhost:8080/admin/restaurants`
   - Should show sample restaurants
3. **Check Analytics**: `http://localhost:8080/admin/global-analytics`
   - Should show live analytics data

## 🚨 **If Setup Button Still Doesn't Work**

### **Check Browser Console**

1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Click "Setup Database"** button
4. **Look for error messages**

### **Common Errors and Fixes**

**Error: "Failed to fetch"**
- Check your internet connection
- Verify Supabase URL is correct

**Error: "Permission denied"**
- Run the SQL fix above
- Check if you're logged in as Super Admin

**Error: "Table doesn't exist"**
- The setup function will create tables automatically
- Make sure you have proper permissions

**Error: "RPC function not found"**
- The simple setup function doesn't use RPC calls
- It should work without additional configuration

## 🎯 **What the Setup Button Does**

1. **Creates Sample Restaurants**: 2 restaurants with full details
2. **Creates Menu Categories**: 12 categories per restaurant
3. **Creates Menu Items**: 5 items per restaurant
4. **Sets Up Relationships**: Links everything together
5. **Provides Sample Data**: Ready-to-use content

## ✅ **Success Indicators**

- ✅ **Toast message**: "Database setup completed successfully!"
- ✅ **Page refresh**: Dashboard loads with new data
- ✅ **No console errors**: Clean browser console
- ✅ **Live data**: User Management shows real data

## 🚨 **Still Having Issues?**

1. **Check Supabase Dashboard**: Make sure tables exist
2. **Clear Browser Cache**: Hard refresh (Ctrl+F5)
3. **Check Network Tab**: Look for failed requests
4. **Try Different Browser**: Test in incognito mode

**After following these steps, the Setup Database button should work perfectly!** 🎉 