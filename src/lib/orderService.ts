import { supabase, isSupabaseDevFallback, forceRealMode } from "../integrations/supabase/client";

// Demo data helpers - only used when not in forceRealMode
function getDemoOrdersKey(restaurantId: string): string {
  return `demo_orders:${restaurantId}`;
}

function seedDemoOrders(restaurantId: string): Order[] {
  if (forceRealMode) return []; // Never generate demo data in real mode
  
  const now = Date.now();
  const toIso = (deltaMin: number) => new Date(now - deltaMin * 60 * 1000).toISOString();

  const demo: Order[] = Array.from({ length: 8 }).map((_, i) => {
    const id = crypto.randomUUID();
    const statuses: Order['status'][] = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    const status = statuses[i % statuses.length];
    const price = 100 + i * 25;
    return {
      id,
      customer_name: `Demo Customer ${i + 1}`,
      customer_email: `customer${i + 1}@example.com`,
      customer_phone: `+91-98${i}${i}${i}${i}12345`,
      order_type: (i % 3 === 0 ? 'dine_in' : i % 3 === 1 ? 'takeaway' : 'delivery'),
      status,
      items: [
        {
          id: crypto.randomUUID(),
          menu_item_id: crypto.randomUUID(),
          menu_item_name: i % 2 === 0 ? 'Margherita Pizza' : 'Paneer Tikka',
          quantity: 1 + (i % 3),
          price,
          notes: i % 2 === 0 ? 'Extra cheese' : undefined,
        },
      ],
      total_amount: price * (1 + (i % 3)),
      tax_amount: 0,
      tip_amount: 0,
      delivery_address: i % 3 === 2 ? '123, Elm Street, City' : undefined,
      table_number: i % 3 === 0 ? `${(i % 10) + 1}` : undefined,
      notes: i % 2 === 1 ? 'Please make it spicy' : undefined,
      restaurant_id: restaurantId,
      created_at: toIso(10 + i * 7),
      updated_at: toIso(5 + i * 3),
      estimated_delivery: undefined,
      actual_delivery: undefined,
    };
  });
  return demo;
}

function loadDemoOrders(restaurantId: string): Order[] {
  if (forceRealMode) return []; // Never load demo data in real mode
  
  try {
    const raw = localStorage.getItem(getDemoOrdersKey(restaurantId));
    if (raw) return JSON.parse(raw) as Order[];
    const seeded = seedDemoOrders(restaurantId);
    localStorage.setItem(getDemoOrdersKey(restaurantId), JSON.stringify(seeded));
    return seeded;
  } catch {
    return seedDemoOrders(restaurantId);
  }
}

function saveDemoOrders(restaurantId: string, orders: Order[]): void {
  if (forceRealMode) return; // Never save demo data in real mode
  
  try {
    localStorage.setItem(getDemoOrdersKey(restaurantId), JSON.stringify(orders));
  } catch {
    // ignore
  }
}

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
      console.log('orderService.getOrders called with restaurantId:', restaurantId);

      // Instant demo fallback without DB
      if (isSupabaseDevFallback && !forceRealMode) {
        return loadDemoOrders(restaurantId);
      }

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

      console.log('orderService.getOrders result:', { data, error });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOrders:', error);
      if (isSupabaseDevFallback && !forceRealMode) {
        return loadDemoOrders(restaurantId);
      }
      return [];
    }
  },

  async createOrder(restaurantId: string, orderData: CreateOrderData): Promise<Order> {
    try {
      if (isSupabaseDevFallback && !forceRealMode) {
        const current = loadDemoOrders(restaurantId);
        const newOrder: Order = {
          id: crypto.randomUUID(),
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          order_type: orderData.order_type,
          status: 'pending',
          items: orderData.items.map((i, idx) => ({
            id: crypto.randomUUID(),
            menu_item_id: i.menu_item_id,
            menu_item_name: i.menu_item_name,
            quantity: i.quantity,
            price: i.price,
            notes: i.notes,
          })),
          total_amount: orderData.total_amount,
          tax_amount: orderData.tax_amount,
          tip_amount: orderData.tip_amount,
          delivery_address: orderData.delivery_address,
          table_number: orderData.table_number,
          notes: orderData.notes,
          restaurant_id: restaurantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          estimated_delivery: orderData.estimated_delivery,
          actual_delivery: undefined,
        };
        const updated = [newOrder, ...current];
        saveDemoOrders(restaurantId, updated);
        return newOrder;
      }

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
      if (isSupabaseDevFallback && !forceRealMode) {
        // Persist locally in demo if API fails
        const fallback = await this.getOrders(restaurantId);
        const newOrder: Order = {
          id: crypto.randomUUID(),
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          order_type: orderData.order_type,
          status: 'pending',
          items: orderData.items.map((i) => ({
            id: crypto.randomUUID(),
            menu_item_id: i.menu_item_id,
            menu_item_name: i.menu_item_name,
            quantity: i.quantity,
            price: i.price,
            notes: i.notes,
          })),
          total_amount: orderData.total_amount,
          tax_amount: orderData.tax_amount,
          tip_amount: orderData.tip_amount,
          delivery_address: orderData.delivery_address,
          table_number: orderData.table_number,
          notes: orderData.notes,
          restaurant_id: restaurantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          estimated_delivery: orderData.estimated_delivery,
          actual_delivery: undefined,
        };
        saveDemoOrders(restaurantId, [newOrder, ...fallback]);
        return newOrder;
      }
      throw error as any;
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    try {
      // If running without backend, apply change locally
      if (isSupabaseDevFallback && !forceRealMode) {
        // Find which restaurant list contains this order
        // We cannot know restaurantId directly; scan a few known keys
        const keys = Object.keys(localStorage).filter(k => k.startsWith('demo_orders:'));
        for (const key of keys) {
          const restaurantId = key.split(':')[1];
          const list = loadDemoOrders(restaurantId);
          const exists = list.find(o => o.id === orderId);
          if (exists) {
            const updated = list.map(o => o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o);
            saveDemoOrders(restaurantId, updated);
            return updated.find(o => o.id === orderId)!;
          }
        }
      }

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
      if (isSupabaseDevFallback && !forceRealMode) {
        // Best-effort demo update if API fails
        const keys = Object.keys(localStorage).filter(k => k.startsWith('demo_orders:'));
        for (const key of keys) {
          const restaurantId = key.split(':')[1];
          const list = loadDemoOrders(restaurantId);
          const exists = list.find(o => o.id === orderId);
          if (exists) {
            const updated = list.map(o => o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o);
            saveDemoOrders(restaurantId, updated);
            return updated.find(o => o.id === orderId)!;
          }
        }
      }
      throw error;
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      if (isSupabaseDevFallback && !forceRealMode) {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('demo_orders:'));
        for (const key of keys) {
          const restaurantId = key.split(':')[1];
          const list = loadDemoOrders(restaurantId);
          const found = list.find(o => o.id === orderId);
          if (found) return found;
        }
        return null;
      }

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
      if (isSupabaseDevFallback && !forceRealMode) {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('demo_orders:'));
        for (const key of keys) {
          const restaurantId = key.split(':')[1];
          const list = loadDemoOrders(restaurantId);
          const found = list.find(o => o.id === orderId);
          if (found) return found;
        }
        return null;
      }
      return null;
    }
  },

  async getOrdersByStatus(restaurantId: string, status: Order['status']): Promise<Order[]> {
    try {
      if (isSupabaseDevFallback && !forceRealMode) {
        const list = loadDemoOrders(restaurantId);
        return list.filter(o => o.status === status);
      }

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
      if (isSupabaseDevFallback && !forceRealMode) {
        const list = loadDemoOrders(restaurantId);
        return list.filter(o => o.status === status);
      }
      return [];
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
      if (isSupabaseDevFallback && !forceRealMode) {
        const data = loadDemoOrders(restaurantId);
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
      }

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
      if (isSupabaseDevFallback && !forceRealMode) {
        const data = loadDemoOrders(restaurantId);
        return {
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
      }
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      };
    }
  },
}; 