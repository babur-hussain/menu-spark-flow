-- Sample Data for Restaurant Management System
-- Run this in your Supabase SQL Editor after the tables are created

-- Insert sample restaurants
INSERT INTO public.restaurants (user_id, name, description, address, phone, email, website, is_active) 
VALUES 
  ('default-admin-id', 'Sample Restaurant', 'A great restaurant with amazing food', '123 Main St, City, State 12345', '+1 (555) 123-4567', 'info@samplerestaurant.com', 'https://samplerestaurant.com', true),
  ('default-manager-id', 'Gourmet Bistro', 'Fine dining experience', '456 Oak Ave, City, State 12345', '+1 (555) 987-6543', 'info@gourmetbistro.com', 'https://gourmetbistro.com', true)
ON CONFLICT DO NOTHING;

-- Insert sample menu categories
INSERT INTO public.menu_categories (restaurant_id, name, description, sort_order, is_active)
SELECT 
  r.id,
  c.name,
  c.description,
  c.sort_order,
  true
FROM public.restaurants r
CROSS JOIN (
  VALUES 
    ('Appetizers', 'Start your meal right', 0),
    ('Main Course', 'Delicious main dishes', 1),
    ('Desserts', 'Sweet endings', 2),
    ('Beverages', 'Refreshing drinks', 3),
    ('Salads', 'Fresh and healthy', 4),
    ('Soups', 'Warm and comforting', 5),
    ('Pasta', 'Italian favorites', 6),
    ('Pizza', 'Perfect pies', 7),
    ('Burgers', 'Juicy and delicious', 8),
    ('Seafood', 'Fresh from the sea', 9),
    ('Grill', 'Char-grilled perfection', 10),
    ('Kids Menu', 'Little ones love these', 11)
) AS c(name, description, sort_order)
ON CONFLICT DO NOTHING;

-- Insert sample menu items
INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, preparation_time, dietary_info, allergens, is_available, is_featured, sort_order)
SELECT 
  r.id,
  mc.id,
  mi.name,
  mi.description,
  mi.price,
  mi.preparation_time,
  mi.dietary_info,
  mi.allergens,
  mi.is_available,
  mi.is_featured,
  mi.sort_order
FROM public.restaurants r
CROSS JOIN public.menu_categories mc
CROSS JOIN (
  VALUES 
    ('Caesar Salad', 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan cheese', 12.99, 10, ARRAY['vegetarian'], ARRAY['dairy', 'gluten'], true, true, 0),
    ('Gourmet Burger', 'Juicy beef patty with lettuce, tomato, onion, and special sauce', 18.99, 15, ARRAY[]::text[], ARRAY['gluten'], true, true, 1),
    ('Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and fresh basil', 22.99, 20, ARRAY['vegetarian'], ARRAY['dairy', 'gluten'], true, false, 2),
    ('Chocolate Lava Cake', 'Warm chocolate cake with molten center, served with vanilla ice cream', 9.99, 8, ARRAY['vegetarian'], ARRAY['dairy', 'eggs', 'gluten'], true, true, 3),
    ('Grilled Salmon', 'Fresh Atlantic salmon grilled to perfection with seasonal vegetables', 28.99, 18, ARRAY[]::text[], ARRAY['fish'], true, false, 4)
) AS mi(name, description, price, preparation_time, dietary_info, allergens, is_available, is_featured, sort_order)
WHERE mc.restaurant_id = r.id
ON CONFLICT DO NOTHING;

-- Insert sample QR codes
INSERT INTO public.qr_codes (restaurant_id, name, type, code, url, table_number, description, is_active, scan_count)
SELECT 
  r.id,
  qc.name,
  qc.type,
  qc.code,
  qc.url,
  qc.table_number,
  qc.description,
  qc.is_active,
  qc.scan_count
FROM public.restaurants r
CROSS JOIN (
  VALUES 
    ('Table 1', 'table', 'QR-1701080000000-abc123def', 'http://localhost:8082/menu?qr=QR-1701080000000-abc123def', '1', 'Main dining area', true, 25),
    ('Table 2', 'table', 'QR-1701080000001-xyz789ghi', 'http://localhost:8082/menu?qr=QR-1701080000001-xyz789ghi', '2', 'Main dining area', true, 18),
    ('Takeaway Counter', 'takeaway', 'QR-1701080000002-mno456pqr', 'http://localhost:8082/menu?qr=QR-1701080000002-mno456pqr', NULL, 'Pickup counter', true, 42),
    ('Delivery Zone A', 'delivery', 'QR-1701080000003-stu123vwx', 'http://localhost:8082/menu?qr=QR-1701080000003-stu123vwx', NULL, 'Local delivery area', true, 15)
) AS qc(name, type, code, url, table_number, description, is_active, scan_count)
ON CONFLICT DO NOTHING;

-- Insert sample reviews
INSERT INTO public.reviews (restaurant_id, customer_name, customer_email, rating, comment, is_approved)
SELECT 
  r.id,
  rev.customer_name,
  rev.customer_email,
  rev.rating,
  rev.comment,
  rev.is_approved
FROM public.restaurants r
CROSS JOIN (
  VALUES 
    ('John Smith', 'john.smith@email.com', 5, 'Amazing food and great service! Will definitely come back.', true),
    ('Sarah Johnson', 'sarah.johnson@email.com', 4, 'Delicious food, friendly staff. Highly recommend!', true),
    ('Mike Davis', 'mike.davis@email.com', 5, 'Best restaurant in town! The food is incredible.', true),
    ('Lisa Wilson', 'lisa.wilson@email.com', 4, 'Great atmosphere and wonderful food. Perfect for date night.', false)
) AS rev(customer_name, customer_email, rating, comment, is_approved)
ON CONFLICT DO NOTHING;

-- Insert sample orders
INSERT INTO public.orders (restaurant_id, customer_name, customer_phone, customer_email, table_number, order_type, status, total_amount, notes)
SELECT 
  r.id,
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  o.table_number,
  o.order_type,
  o.status,
  o.total_amount,
  o.notes
FROM public.restaurants r
CROSS JOIN (
  VALUES 
    ('Alice Johnson', '+1 (555) 111-2222', 'alice@email.com', '3', 'dine_in', 'completed', 45.97, 'Extra napkins please'),
    ('Bob Smith', '+1 (555) 333-4444', 'bob@email.com', NULL, 'takeaway', 'ready', 32.50, 'No onions'),
    ('Carol Davis', '+1 (555) 555-6666', 'carol@email.com', '5', 'dine_in', 'preparing', 28.75, 'Well done steak'),
    ('David Wilson', '+1 (555) 777-8888', 'david@email.com', NULL, 'delivery', 'confirmed', 67.25, 'Ring doorbell twice')
) AS o(customer_name, customer_phone, customer_email, table_number, order_type, status, total_amount, notes)
ON CONFLICT DO NOTHING;

-- Insert sample order items
INSERT INTO public.order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions)
SELECT 
  o.id,
  mi.id,
  oi.quantity,
  oi.unit_price,
  oi.total_price,
  oi.special_instructions
FROM public.orders o
CROSS JOIN public.menu_items mi
CROSS JOIN (
  VALUES 
    (1, 18.99, 18.99, 'Medium rare'),
    (2, 12.99, 25.98, 'Extra dressing'),
    (1, 9.99, 9.99, 'No nuts'),
    (1, 22.99, 22.99, 'Extra cheese')
) AS oi(quantity, unit_price, total_price, special_instructions)
WHERE o.restaurant_id = mi.restaurant_id
LIMIT 4
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Sample data has been successfully inserted!' as message; 