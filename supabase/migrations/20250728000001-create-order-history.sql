-- Create order_history table for permanent storage
CREATE TABLE IF NOT EXISTS order_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tip_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_address TEXT,
  table_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  bill_generated BOOLEAN DEFAULT FALSE,
  bill_generated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_history_restaurant_id ON order_history(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON order_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_history_status ON order_history(status);
CREATE INDEX IF NOT EXISTS idx_order_history_bill_generated ON order_history(bill_generated);

-- Enable RLS
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Restaurant managers can view their own order history" ON order_history
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'restaurant_manager'
    )
  );

CREATE POLICY "Super admins can view all order history" ON order_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Restaurant managers can insert their own order history" ON order_history
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'restaurant_manager'
    )
  );

CREATE POLICY "Super admins can insert order history" ON order_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Restaurant managers can update their own order history" ON order_history
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'restaurant_manager'
    )
  );

CREATE POLICY "Super admins can update order history" ON order_history
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  ); 