import { supabase } from '../integrations/supabase/client';

export interface OrderItemHistoryEntry {
  name?: string;
  menu_item_name?: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface OrderHistoryEntry {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: OrderItemHistoryEntry[];
  total_amount: number;
  tax_amount: number;
  tip_amount: number;
  delivery_address?: string;
  table_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  bill_generated: boolean;
  bill_generated_at?: string;
}

export const orderHistoryService = {
  // Save order to permanent history
  async saveToPermanentHistory(
    order: Partial<Omit<OrderHistoryEntry, 'id' | 'restaurant_id' | 'restaurant_name' | 'status' | 'order_type' | 'items' | 'total_amount' | 'tax_amount' | 'tip_amount' | 'created_at' | 'updated_at' | 'bill_generated'>> & {
      status?: OrderHistoryEntry['status'];
      order_type?: OrderHistoryEntry['order_type'];
      items?: OrderItemHistoryEntry[];
      total_amount?: number;
      tax_amount?: number;
      tip_amount?: number;
      created_at?: string;
      updated_at?: string;
    },
    restaurantId: string,
    restaurantName: string
  ): Promise<void> {
    try {
      const historyEntry: Omit<OrderHistoryEntry, 'id'> = {
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        customer_name: order.customer_name || order.customer,
        customer_email: order.customer_email || 'guest@restaurant.com',
        customer_phone: order.customer_phone || 'N/A',
        order_type: order.order_type || 'dine_in',
        status: order.status || 'pending',
        items: order.items || [],
        total_amount: order.total_amount || order.total,
        tax_amount: order.tax_amount || 0,
        tip_amount: order.tip_amount || 0,
        delivery_address: order.delivery_address,
        table_number: order.table_number || order.tableNumber,
        notes: order.notes,
        created_at: order.created_at || new Date().toISOString(),
        updated_at: order.updated_at || new Date().toISOString(),
        completed_at: order.status === 'completed' ? new Date().toISOString() : undefined,
        bill_generated: false,
      };

      const { error } = await supabase
        .from('order_history')
        .insert([historyEntry]);

      if (error) {
        console.error('Error saving to permanent history:', error);
        throw error;
      }

      console.log('Order saved to permanent history successfully');
    } catch (error) {
      console.error('Error in saveToPermanentHistory:', error);
      throw error;
    }
  },

  // Update order status in permanent history
  async updateOrderStatus(orderId: string, status: OrderHistoryEntry['status'], billGenerated: boolean = false): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (billGenerated) {
        updateData.bill_generated = true;
        updateData.bill_generated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('order_history')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status in history:', error);
        throw error;
      }

      console.log('Order status updated in permanent history');
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      throw error;
    }
  },

  // Get order history for super admin (all orders)
  async getAllOrderHistory(): Promise<OrderHistoryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('order_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all order history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllOrderHistory:', error);
      throw error;
    }
  },

  // Get order history for restaurant manager
  async getRestaurantOrderHistory(restaurantId: string): Promise<OrderHistoryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('order_history')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching restaurant order history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRestaurantOrderHistory:', error);
      throw error;
    }
  },

  // Get order history statistics
  async getOrderHistoryStats(restaurantId?: string): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
    averageOrderValue: number;
    billGeneratedCount: number;
  }> {
    try {
      let query = supabase
        .from('order_history')
        .select('status, total_amount, bill_generated');

      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching order history stats:', error);
        throw error;
      }

      const orders = data || [];
      const completed = orders.filter(o => o.status === 'completed').length;
      const cancelled = orders.filter(o => o.status === 'cancelled').length;
      const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + order.total_amount, 0);
      const averageOrderValue = orders.length > 0 
        ? orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length 
        : 0;
      const billGeneratedCount = orders.filter(o => o.bill_generated).length;

      return {
        total: orders.length,
        completed,
        cancelled,
        totalRevenue,
        averageOrderValue,
        billGeneratedCount,
      };
    } catch (error) {
      console.error('Error in getOrderHistoryStats:', error);
      throw error;
    }
  },
}; 