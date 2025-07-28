import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RestaurantStats {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  isActive: boolean;
  totalOrders: number;
  totalRevenue: number;
  avgRating: number;
  activeMenuItems: number;
  todayOrders: number;
  todayRevenue: number;
  avgOrderTime: number;
  customerRating: number;
}

export interface RestaurantOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  table_number?: string;
  items_count: number;
}

export interface RestaurantAnalytics {
  stats: RestaurantStats;
  recentOrders: RestaurantOrder[];
  dailyStats: { date: string; orders: number; revenue: number }[];
  weeklyStats: { week: string; orders: number; revenue: number }[];
  monthlyStats: { month: string; orders: number; revenue: number }[];
}

class RestaurantAnalyticsService {
  async getRestaurantData(userId: string): Promise<RestaurantAnalytics | null> {
    try {
      // Get the restaurant associated with this user
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (restaurantError || !restaurant) {
        console.error('Error fetching restaurant:', restaurantError);
        return null;
      }

      // Get all orders for this restaurant
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return null;
      }

      const ordersList = orders || [];

      // Calculate statistics
      const stats = this.calculateRestaurantStats(restaurant, ordersList);
      const recentOrders = this.getRecentOrders(ordersList);
      const dailyStats = this.calculateDailyStats(ordersList);
      const weeklyStats = this.calculateWeeklyStats(ordersList);
      const monthlyStats = this.calculateMonthlyStats(ordersList);

      return {
        stats,
        recentOrders,
        dailyStats,
        weeklyStats,
        monthlyStats
      };
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      return null;
    }
  }

  private calculateRestaurantStats(restaurant: any, orders: any[]): RestaurantStats {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    // Calculate today's stats
    const today = new Date();
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.toDateString() === today.toDateString();
    });
    
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    // Calculate average order time (simplified - you might want to track actual prep times)
    const completedOrders = orders.filter(order => order.status === 'completed');
    const avgOrderTime = completedOrders.length > 0 ? 18 : 0; // Placeholder - you'd calculate actual times

    // Calculate average rating (placeholder - you might want to add a ratings table)
    const avgRating = 4.5 + Math.random() * 0.5;

    // Calculate customer rating (placeholder)
    const customerRating = 4.8 + Math.random() * 0.2;

    return {
      name: restaurant.name,
      description: restaurant.description || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      website: restaurant.website || '',
      isActive: restaurant.is_active,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgRating: Math.round(avgRating * 10) / 10,
      activeMenuItems: 45, // Placeholder - you'd get this from menu_items table
      todayOrders: todayOrders.length,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      avgOrderTime,
      customerRating: Math.round(customerRating * 10) / 10
    };
  }

  private getRecentOrders(orders: any[]): RestaurantOrder[] {
    return orders.slice(0, 10).map(order => ({
      id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      order_type: order.order_type,
      status: order.status,
      total_amount: order.total_amount,
      notes: order.notes,
      created_at: order.created_at,
      updated_at: order.updated_at,
      table_number: order.table_number,
      items_count: Math.floor(Math.random() * 5) + 1 // Placeholder - you'd get this from order_items
    }));
  }

  private calculateDailyStats(orders: any[]): { date: string; orders: number; revenue: number }[] {
    const dailyStats: { [key: string]: { orders: number; revenue: number } } = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at).toDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = { orders: 0, revenue: 0 };
      }
      dailyStats[date].orders += 1;
      dailyStats[date].revenue += order.total_amount || 0;
    });

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date: new Date(date).toLocaleDateString(),
        orders: stats.orders,
        revenue: Math.round(stats.revenue * 100) / 100
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  }

  private calculateWeeklyStats(orders: any[]): { week: string; orders: number; revenue: number }[] {
    const weeklyStats: { [key: string]: { orders: number; revenue: number } } = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toDateString();
      
      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = { orders: 0, revenue: 0 };
      }
      weeklyStats[weekKey].orders += 1;
      weeklyStats[weekKey].revenue += order.total_amount || 0;
    });

    return Object.entries(weeklyStats)
      .map(([week, stats]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: stats.orders,
        revenue: Math.round(stats.revenue * 100) / 100
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-4); // Last 4 weeks
  }

  private calculateMonthlyStats(orders: any[]): { month: string; orders: number; revenue: number }[] {
    const monthlyStats: { [key: string]: { orders: number; revenue: number } } = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { orders: 0, revenue: 0 };
      }
      monthlyStats[monthKey].orders += 1;
      monthlyStats[monthKey].revenue += order.total_amount || 0;
    });

    return Object.entries(monthlyStats)
      .map(([month, stats]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        orders: stats.orders,
        revenue: Math.round(stats.revenue * 100) / 100
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months
  }
}

export const restaurantAnalyticsService = new RestaurantAnalyticsService(); 