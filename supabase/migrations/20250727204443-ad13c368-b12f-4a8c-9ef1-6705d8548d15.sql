-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu categories table
CREATE TABLE public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  preparation_time INTEGER, -- in minutes
  dietary_info TEXT[], -- array of dietary information
  allergens TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  table_number TEXT,
  order_type TEXT NOT NULL DEFAULT 'dine_in', -- dine_in, takeaway, delivery
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, preparing, ready, completed, cancelled
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for restaurants (restaurant owners can manage their own restaurants)
CREATE POLICY "Restaurant owners can view their own restaurants" 
ON public.restaurants 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can create restaurants" 
ON public.restaurants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can update their own restaurants" 
ON public.restaurants 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active restaurants" 
ON public.restaurants 
FOR SELECT 
USING (is_active = true);

-- Create policies for menu categories
CREATE POLICY "Restaurant owners can manage their menu categories" 
ON public.menu_categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.restaurants 
  WHERE id = restaurant_id AND user_id = auth.uid()
));

CREATE POLICY "Anyone can view active menu categories" 
ON public.menu_categories 
FOR SELECT 
USING (is_active = true);

-- Create policies for menu items
CREATE POLICY "Restaurant owners can manage their menu items" 
ON public.menu_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.restaurants 
  WHERE id = restaurant_id AND user_id = auth.uid()
));

CREATE POLICY "Anyone can view available menu items" 
ON public.menu_items 
FOR SELECT 
USING (is_available = true);

-- Create policies for orders
CREATE POLICY "Restaurant owners can manage their orders" 
ON public.orders 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.restaurants 
  WHERE id = restaurant_id AND user_id = auth.uid()
));

CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view their own orders" 
ON public.orders 
FOR SELECT 
USING (true);

-- Create policies for order items
CREATE POLICY "Restaurant owners can manage order items for their restaurants" 
ON public.order_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.restaurants r ON o.restaurant_id = r.id
  WHERE o.id = order_id AND r.user_id = auth.uid()
));

CREATE POLICY "Anyone can view order items" 
ON public.order_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at
BEFORE UPDATE ON public.menu_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders table
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.orders;

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('restaurant-images', 'restaurant-images', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true);

-- Create storage policies
CREATE POLICY "Anyone can view restaurant images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Restaurant owners can upload restaurant images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'restaurant-images');

CREATE POLICY "Anyone can view menu images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-images');

CREATE POLICY "Restaurant owners can upload menu images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'menu-images');