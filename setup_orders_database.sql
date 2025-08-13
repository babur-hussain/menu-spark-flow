-- Setup Orders Database
-- Run this in your Supabase SQL Editor to fix the 0 orders issue

-- 1. Create restaurants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    delivery_address TEXT,
    table_number TEXT,
    notes TEXT,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE
);

-- 3. Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('restaurant_manager', 'super_admin')),
    restaurant_id UUID REFERENCES public.restaurants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for restaurants
DROP POLICY IF EXISTS "Restaurants are viewable by authenticated users" ON public.restaurants;
CREATE POLICY "Restaurants are viewable by authenticated users" ON public.restaurants
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Restaurants are insertable by authenticated users" ON public.restaurants;
CREATE POLICY "Restaurants are insertable by authenticated users" ON public.restaurants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Restaurants are updatable by restaurant managers" ON public.restaurants;
CREATE POLICY "Restaurants are updatable by restaurant managers" ON public.restaurants
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND restaurant_id = restaurants.id
        )
    );

-- 7. Create RLS policies for orders
DROP POLICY IF EXISTS "Orders are viewable by restaurant staff" ON public.orders;
CREATE POLICY "Orders are viewable by restaurant staff" ON public.orders
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE id = auth.uid() AND restaurant_id = orders.restaurant_id
            ) OR
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE id = auth.uid() AND role = 'super_admin'
            )
        )
    );

DROP POLICY IF EXISTS "Orders are insertable by authenticated users" ON public.orders;
CREATE POLICY "Orders are insertable by authenticated users" ON public.orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Orders are updatable by restaurant staff" ON public.orders;
CREATE POLICY "Orders are updatable by restaurant staff" ON public.orders
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE id = auth.uid() AND restaurant_id = orders.restaurant_id
            ) OR
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE id = auth.uid() AND role = 'super_admin'
            )
        )
    );

-- 8. Create RLS policies for order_items
DROP POLICY IF EXISTS "Order items are viewable by restaurant staff" ON public.order_items;
CREATE POLICY "Order items are viewable by restaurant staff" ON public.order_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.orders o
                JOIN public.user_profiles up ON up.restaurant_id = o.restaurant_id
                WHERE o.id = order_items.order_id AND up.id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE id = auth.uid() AND role = 'super_admin'
            )
        )
    );

DROP POLICY IF EXISTS "Order items are insertable by authenticated users" ON public.order_items;
CREATE POLICY "Order items are insertable by authenticated users" ON public.order_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 9. Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (id = auth.uid());

-- 10. Insert sample restaurant if none exist
INSERT INTO public.restaurants (id, name, description, address, phone, email, is_active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Demo Restaurant',
    'A demo restaurant for testing the system',
    '123 Demo Street, Demo City, DC 12345',
    '+1-555-0123',
    'demo@restaurant.com',
    true
)
ON CONFLICT DO NOTHING;

-- 11. Insert sample orders if none exist
INSERT INTO public.orders (
    id,
    customer_name,
    customer_email,
    customer_phone,
    order_type,
    status,
    total_amount,
    restaurant_id,
    notes
)
VALUES 
    (
        '550e8400-e29b-41d4-a716-446655440001',
        'John Smith',
        'john.smith@example.com',
        '+1-555-0124',
        'dine_in',
        'pending',
        32.97,
        '550e8400-e29b-41d4-a716-446655440000',
        'Extra cheese on pizza'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002',
        'Sarah Johnson',
        'sarah.johnson@example.com',
        '+1-555-0125',
        'takeaway',
        'confirmed',
        18.99,
        '550e8400-e29b-41d4-a716-446655440000',
        'Make it spicy'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440003',
        'Mike Davis',
        'mike.davis@example.com',
        '+1-555-0126',
        'delivery',
        'preparing',
        45.98,
        '550e8400-e29b-41d4-a716-446655440000',
        'Ring doorbell twice'
    )
ON CONFLICT DO NOTHING;

-- 12. Insert sample order items
INSERT INTO public.order_items (
    order_id,
    menu_item_id,
    quantity,
    unit_price,
    total_price,
    special_instructions
)
VALUES 
    (
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440010',
        1,
        22.99,
        22.99,
        'Extra cheese'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440011',
        1,
        9.98,
        9.98,
        'No onions'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440012',
        1,
        18.99,
        18.99,
        'Make it spicy'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440013',
        2,
        22.99,
        45.98,
        'Ring doorbell twice'
    )
ON CONFLICT DO NOTHING;

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_restaurant_id ON public.user_profiles(restaurant_id);

-- 14. Verify the setup
SELECT 
    'Restaurants' as table_name,
    COUNT(*) as count
FROM public.restaurants
UNION ALL
SELECT 
    'Orders' as table_name,
    COUNT(*) as count
FROM public.orders
UNION ALL
SELECT 
    'Order Items' as table_name,
    COUNT(*) as count
FROM public.order_items;

-- 15. Show sample data
SELECT 
    'Sample Orders' as info,
    o.id,
    o.customer_name,
    o.status,
    o.total_amount,
    r.name as restaurant_name
FROM public.orders o
JOIN public.restaurants r ON o.restaurant_id = r.id
LIMIT 5;
