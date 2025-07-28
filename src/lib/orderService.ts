import { supabase } from "../integrations/supabase/client";

export interface OrderItem {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  total_amount: number;
  tax_amount: number;
  tip_amount: number;
  delivery_address?: string;
  table_number?: string;
  notes?: string;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
  estimated_delivery?: string;
  actual_delivery?: string;
}

export interface CreateOrderData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  items: Omit<OrderItem, 'id'>[];
  total_amount: number;
  tax_amount: number;
  tip_amount: number;
  delivery_address?: string;
  table_number?: string;
  notes?: string;
  estimated_delivery?: string;
}

export const orderService = {
  async getOrders(restaurantId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            menu_item_name,
            quantity,
            price,
            notes
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOrders:', error);
      throw error;
    }
  },

  async createOrder(restaurantId: string, orderData: CreateOrderData): Promise<Order> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          ...orderData,
          restaurant_id: restaurantId,
          status: 'pending',
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      // Insert order items
      if (orderData.items.length > 0) {
        const orderItems = orderData.items.map(item => ({
          ...item,
          order_id: order.id,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
          throw itemsError;
        }
      }

      return order;
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      throw error;
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            menu_item_name,
            quantity,
            price,
            notes
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrderById:', error);
      throw error;
    }
  },

  async getOrdersByStatus(restaurantId: string, status: Order['status']): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            menu_item_name,
            quantity,
            price,
            notes
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders by status:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOrdersByStatus:', error);
      throw error;
    }
  },

  async getOrdersStats(restaurantId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status, total_amount')
        .eq('restaurant_id', restaurantId);

      if (error) {
        console.error('Error fetching order stats:', error);
        throw error;
      }

      const stats = {
        total: data.length,
        pending: data.filter(o => o.status === 'pending').length,
        confirmed: data.filter(o => o.status === 'confirmed').length,
        preparing: data.filter(o => o.status === 'preparing').length,
        ready: data.filter(o => o.status === 'ready').length,
        completed: data.filter(o => o.status === 'completed').length,
        cancelled: data.filter(o => o.status === 'cancelled').length,
        totalRevenue: data.reduce((sum, order) => sum + order.total_amount, 0),
        averageOrderValue: data.length > 0 ? data.reduce((sum, order) => sum + order.total_amount, 0) / data.length : 0,
      };

      return stats;
    } catch (error) {
      console.error('Error in getOrdersStats:', error);
      throw error;
    }
  },
}; 