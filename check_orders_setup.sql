-- Check Orders Setup and Data
-- Run this in your Supabase SQL editor to diagnose the issue

-- 1. Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('orders', 'order_items', 'restaurants', 'user_profiles');

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- 3. Check if there are any restaurants
SELECT 
  id,
  name,
  created_at
FROM restaurants
LIMIT 10;

-- 4. Check if there are any orders
SELECT 
  id,
  customer_name,
  restaurant_id,
  status,
  created_at
FROM orders
LIMIT 10;

-- 5. Check user profiles and their restaurant associations
SELECT 
  up.id,
  up.email,
  up.role,
  up.restaurant_id,
  r.name as restaurant_name
FROM user_profiles up
LEFT JOIN restaurants r ON up.restaurant_id = r.id
LIMIT 10;

-- 6. Check RLS policies on orders table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'orders';

-- 7. Create a test restaurant if none exist
INSERT INTO restaurants (id, name, description, address, phone, email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Demo Restaurant',
  'A demo restaurant for testing',
  '123 Demo Street, Demo City',
  '+1-555-0123',
  'demo@restaurant.com',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 8. Create a test order if none exist
INSERT INTO orders (
  id,
  customer_name,
  customer_email,
  customer_phone,
  order_type,
  status,
  total_amount,
  restaurant_id,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  'Test Customer',
  'test@customer.com',
  '+1-555-0123',
  'dine_in',
  'pending',
  25.99,
  r.id,
  NOW(),
  NOW()
FROM restaurants r
LIMIT 1
ON CONFLICT DO NOTHING;

-- 9. Create test order items
INSERT INTO order_items (
  id,
  order_id,
  menu_item_id,
  quantity,
  unit_price,
  total_price
)
SELECT 
  gen_random_uuid(),
  o.id,
  gen_random_uuid(),
  2,
  12.99,
  25.98
FROM orders o
LIMIT 1
ON CONFLICT DO NOTHING;

-- 10. Check final state
SELECT 
  'Restaurants' as table_name,
  COUNT(*) as count
FROM restaurants
UNION ALL
SELECT 
  'Orders' as table_name,
  COUNT(*) as count
FROM orders
UNION ALL
SELECT 
  'Order Items' as table_name,
  COUNT(*) as count
FROM order_items;
