import { supabase } from "@/integrations/supabase/client";

// Fail-safe timeout wrapper to prevent infinite loading states when network stalls
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000, label = "request"): Promise<T> {
  try {
    const timeout = new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    );
    // Race the actual promise with a timeout
    // @ts-expect-error: Promise.race typing is fine here
    return await Promise.race([promise, timeout]);
  } catch (error) {
    console.error(`[analytics] ${label} failed:`, error);
    throw error;
  }
}

export interface DashboardStats {
  totalRestaurants: number;
  totalUsers: number;
  totalRevenue: number;
  growthRate: number;
}

export interface Restaurant {
  id: string;
  name: string;
  owner: string;
  location: string;
  status: 'active' | 'pending' | 'suspended';
  rating: number;
  monthlyRevenue: number;
  orders: number;
  joinDate: string;
  email: string;
  phone: string;
  description: string;
}

export interface SystemActivity {
  id: string;
  type: 'new_restaurant' | 'payment' | 'issue' | 'milestone' | 'login' | 'order';
  message: string;
  timestamp: string;
  restaurant_id?: string;
  restaurant_name?: string;
}

export interface AnalyticsData {
  stats: DashboardStats;
  restaurants: Restaurant[];
  activities: SystemActivity[];
  revenueData: { month: string; revenue: number }[];
  orderData: { month: string; orders: number }[];
}

class AnalyticsService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get total restaurants
      const { count: totalRestaurants } = await withTimeout(
        supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true }),
        8000,
        'count restaurants'
      );

      // Get total users (from user_profiles)
      const { count: totalUsers } = await withTimeout(
        supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true }),
        8000,
        'count user_profiles'
      );

      // Calculate total revenue from orders
      const { data: orders } = await withTimeout(
        supabase
        .from('orders')
        .select('total_amount, created_at'),
        8000,
        'fetch orders for totals'
      );

      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Calculate growth rate (simplified - comparing current month to previous month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const currentMonthOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }) || [];

      const previousMonthOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear;
      }) || [];

      const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      const growthRate = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;

      return {
        totalRestaurants: totalRestaurants || 0,
        totalUsers: totalUsers || 0,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        growthRate: Math.round(growthRate * 10) / 10
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalRestaurants: 0,
        totalUsers: 0,
        totalRevenue: 0,
        growthRate: 0
      };
    }
  }

  async getRestaurants(): Promise<Restaurant[]> {
    try {
      const { data: restaurants, error } = await withTimeout(
        supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false }),
        8000,
        'fetch restaurants'
      );

      if (error) {
        console.error('Error fetching restaurants:', error);
        return [];
      }

      // Get order counts and revenue for each restaurant
      const restaurantsWithStats = await Promise.all(
        restaurants.map(async (restaurant) => {
          // Get orders for this restaurant
          const { data: orders } = await withTimeout(
            supabase
            .from('orders')
            .select('total_amount, created_at')
            .eq('restaurant_id', restaurant.id),
            8000,
            `fetch orders for restaurant ${restaurant.id}`
          );

          const totalOrders = orders?.length || 0;
          const monthlyRevenue = orders?.reduce((sum, order) => {
            const orderDate = new Date(order.created_at);
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
              return sum + (order.total_amount || 0);
            }
            return sum;
          }, 0) || 0;

          // Calculate average rating (simplified - you might want to add a ratings table)
          const rating = 4.5 + Math.random() * 0.5; // Placeholder rating

          return {
            id: restaurant.id,
            name: restaurant.name,
            owner: restaurant.user_id, // You might want to join with user_profiles to get actual name
            location: restaurant.address || 'Location not specified',
            status: restaurant.is_active ? 'active' : 'suspended',
            rating: Math.round(rating * 10) / 10,
            monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
            orders: totalOrders,
            joinDate: restaurant.created_at,
            email: restaurant.email || '',
            phone: restaurant.phone || '',
            description: restaurant.description || ''
          };
        })
      );

      return restaurantsWithStats;
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
  }

  async getSystemActivities(): Promise<SystemActivity[]> {
    try {
      // Get recent orders as activities
      const { data: recentOrders } = await withTimeout(
        supabase
        .from('orders')
        .select(`
          *,
          restaurants!orders_restaurant_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10),
        8000,
        'fetch recent orders'
      );

      const activities: SystemActivity[] = [];

      if (recentOrders) {
        recentOrders.forEach((order, index) => {
          const timestamp = new Date(order.created_at);
          const hoursAgo = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60 * 60));

          activities.push({
            id: order.id,
            type: 'order',
            message: `${order.restaurants?.name || 'Restaurant'} received order #${order.id.slice(-6)}`,
            timestamp: order.created_at,
            restaurant_id: order.restaurant_id,
            restaurant_name: order.restaurants?.name
          });
        });
      }

      return activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10);
    } catch (error) {
      console.error('Error fetching system activities:', error);
      return [];
    }
  }

  async getRevenueData(): Promise<{ month: string; revenue: number }[]> {
    try {
      const { data: orders } = await withTimeout(
        supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()),
        8000,
        'fetch revenue window orders'
      );

      if (!orders) return [];

      const monthlyRevenue: { [key: string]: number } = {};

      orders.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (order.total_amount || 0);
      });

      return Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: Math.round(revenue * 100) / 100
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return [];
    }
  }

  async getOrderData(): Promise<{ month: string; orders: number }[]> {
    try {
      const { data: orders } = await withTimeout(
        supabase
        .from('orders')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()),
        8000,
        'fetch orders window for counts'
      );

      if (!orders) return [];

      const monthlyOrders: { [key: string]: number } = {};

      orders.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyOrders[monthKey] = (monthlyOrders[monthKey] || 0) + 1;
      });

      return Object.entries(monthlyOrders)
        .map(([month, orders]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          orders
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    } catch (error) {
      console.error('Error fetching order data:', error);
      return [];
    }
  }

  async getAllAnalyticsData(): Promise<AnalyticsData> {
    const [stats, restaurants, activities, revenueData, orderData] = await Promise.all([
      this.getDashboardStats(),
      this.getRestaurants(),
      this.getSystemActivities(),
      this.getRevenueData(),
      this.getOrderData()
    ]);

    return {
      stats,
      restaurants,
      activities,
      revenueData,
      orderData
    };
  }
}

export const analyticsService = new AnalyticsService(); 