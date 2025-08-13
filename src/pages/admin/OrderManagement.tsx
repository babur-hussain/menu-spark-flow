import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Printer,
  MessageSquare,
  Calendar,
  Timer,
  Loader2,
  Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/contexts/AuthContext";
import { orderService, Order, OrderItem } from "@/lib/orderService";
import { getCachedValue, setCachedValue, withTimeout as fastTimeout } from "@/lib/fastCache";
import { supabase, forceRealMode } from "@/integrations/supabase/client";
import { formatCurrency } from '@/lib/utils';
import { simpleSetupDatabase } from "@/lib/simpleSetup";

export default function OrderManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Debug info
  console.log('OrderManagement Debug Info:', {
    user,
    forceRealMode,
    isSupabaseDevFallback: supabase.isSupabaseDevFallback,
    supabaseUrl: supabase.supabaseUrl,
    hasRestaurantId: !!user?.restaurant_id,
    restaurantId: user?.restaurant_id,
    userRole: user?.role
  });

  const computeStats = (list: Order[]) => ({
    total: list.length,
    pending: list.filter(o => o.status === 'pending').length,
    confirmed: list.filter(o => o.status === 'confirmed').length,
    preparing: list.filter(o => o.status === 'preparing').length,
    ready: list.filter(o => o.status === 'ready').length,
    completed: list.filter(o => o.status === 'completed').length,
    cancelled: list.filter(o => o.status === 'cancelled').length,
    totalRevenue: list.reduce((sum, order) => sum + order.total_amount, 0),
    averageOrderValue: list.length > 0 ? list.reduce((sum, order) => sum + order.total_amount, 0) / list.length : 0,
  });

  const loadOrdersFast = async () => {
    let restaurantId = user?.restaurant_id;
    console.log('OrderManagement: Starting loadOrdersFast...');
    console.log('OrderManagement: user:', user);
    console.log('OrderManagement: restaurant_id:', restaurantId);
    console.log('OrderManagement: user.restaurant_id type:', typeof user?.restaurant_id);
    console.log('OrderManagement: user.restaurant_id value:', user?.restaurant_id);
    
    // Set loading state immediately
    setIsLoading(true);
    
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.error('OrderManagement: Safety timeout reached - forcing loading to stop');
      setIsLoading(false);
      toast({
        title: "Loading Timeout",
        description: "Order loading took too long. Please try refreshing the page.",
        variant: "destructive",
      });
    }, 15000); // 15 second timeout
    
    try {
      // First, check if the necessary tables exist
      console.log('Checking database tables...');
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from('orders')
          .select('id')
          .limit(1);
        
        if (tableError && tableError.code === '42P01') {
          console.log('Orders table does not exist, creating database schema...');
          // The table doesn't exist, we need to create it
          // For now, just show an error message
          throw new Error('Database schema not set up. Please run the database setup script first.');
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('Database schema not set up')) {
          throw e;
        }
        // Other errors are fine, table exists
      }
      
      // Debug: Check if user profile has restaurant_id
      if (user?.id) {
        console.log('OrderManagement: Checking user profile...');
        try {
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('restaurant_id, restaurants(name)')
            .eq('id', user.id)
            .single();
          
          console.log('User profile from database:', { data: userProfile, error: profileError });
          
          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
        }
      }

      // Clear any old cache
      const cacheKey = restaurantId ? `orders:${restaurantId}` : 'orders:unknown';
      try {
        localStorage.removeItem(`fastcache:${cacheKey}`);
        localStorage.removeItem(`demo_orders:${restaurantId}`);
      } catch {}
      
      if (!restaurantId) {
        console.log('No restaurant_id found for user, cannot fetch orders');
        clearTimeout(safetyTimeout);
        setIsLoading(false);
        return;
      }

      // Check if the restaurant_id is valid (not a demo UUID)
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(restaurantId);
      console.log('Restaurant ID validation:', { restaurantId, isValidUUID });
      
      // IMPORTANT: Never change the restaurant_id after it's been assigned
      // Only verify that the restaurant exists, don't create new ones
      if (isValidUUID && restaurantId.length === 36) {
        console.log('Verifying restaurant exists in database...');
        try {
          const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .select('id, name')
            .eq('id', restaurantId)
            .single();
          
          console.log('Restaurant verification result:', { restaurant, error: restaurantError });
          
          if (restaurantError || !restaurant) {
            console.error('CRITICAL: Restaurant not found in database but user has restaurant_id:', restaurantId);
            console.error('This should never happen - restaurant_id should be permanent and unique');
            
            // Don't create a new restaurant or change the ID - this breaks the system
            // Instead, show an error and ask user to contact support
            throw new Error(`Restaurant ID ${restaurantId} not found in database. This indicates a data integrity issue. Please contact support.`);
          }
          
          console.log('Restaurant verified successfully:', restaurant.name);
        } catch (e) {
          console.error('Error verifying restaurant:', e);
          throw e; // Re-throw to prevent loading orders with invalid restaurant
        }
      }

      // First, let's check if there are any orders at all in the database
      console.log('Checking total orders in database...');
      try {
        const { count: totalOrders, error: countError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        
        console.log('Total orders in database:', { count: totalOrders, error: countError });
        
        if (countError) {
          console.error('Count query error:', countError);
        }
      } catch (e) {
        console.error('Error counting orders:', e);
      }

      // Now fetch orders for this specific restaurant
      console.log('Fetching orders for restaurant:', restaurantId);
      try {
        let query = supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              quantity,
              unit_price,
              special_instructions,
              menu_item:menu_items(name)
            )
          `)
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false });
        
        const { data: rawOrders, error: ordersError } = await fastTimeout(
          query,
          8000,
          'load orders real'
        );
        
        console.log('Raw orders response:', { 
          data: rawOrders, 
          error: ordersError, 
          count: rawOrders?.length,
          restaurantId 
        });
        
        if (ordersError) {
          console.error('Orders fetch error:', ordersError);
          throw ordersError;
        }

        const normalized: Order[] = (rawOrders || []).map((o: any) => ({
          id: o.id,
          customer_name: o.customer_name,
          customer_email: o.customer_email,
          customer_phone: o.customer_phone,
          order_type: o.order_type,
          status: o.status,
          items: (o.order_items || []).map((i: any) => ({ 
            id: i.id, 
            quantity: i.quantity, 
            price: i.unit_price, 
            menu_item_name: i.menu_item?.name || 'Item', 
            notes: i.special_instructions || '' 
          })),
          total_amount: o.total_amount,
          tax_amount: 0,
          tip_amount: 0,
          delivery_address: o.delivery_address,
          table_number: o.table_number,
          notes: o.notes,
          restaurant_id: o.restaurant_id,
          created_at: o.created_at,
          updated_at: o.updated_at,
          estimated_delivery: o.estimated_delivery,
          actual_delivery: o.actual_delivery,
        }));

        console.log('Normalized orders:', normalized);
        setOrders(normalized);
        setOrderStats(computeStats(normalized));
        
        // Clear the safety timeout since we succeeded
        clearTimeout(safetyTimeout);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Orders fetch failed:', error);
        throw error;
      }
      
    } catch (error) {
      console.error('Orders load failed:', error);
      // Clear the safety timeout
      clearTimeout(safetyTimeout);
      setIsLoading(false);
      
      // Show error to user
      toast({
        title: "Error Loading Orders",
        description: `Failed to load orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  // Fetch orders on component mount and subscribe to realtime updates
  useEffect(() => {
    loadOrdersFast();

    // Enhanced real-time subscription for automatic updates
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
        console.log('Real-time order update:', payload);
        
        if (payload.eventType === 'INSERT') {
          const o: any = payload.new;
          
          // Fetch order items for the new order
          const { data: items } = await supabase
            .from('order_items')
            .select('id, quantity, unit_price, total_price, special_instructions, menu_item:menu_items(name)')
            .eq('order_id', o.id);
          
          const newOrder: Order = {
            id: o.id,
            customer_name: o.customer_name,
            customer_email: o.customer_email,
            customer_phone: o.customer_phone,
            order_type: o.order_type,
            status: o.status,
            items: (items || []).map(i => ({ 
              id: i.id, 
              quantity: i.quantity, 
              price: i.unit_price, 
              menu_item_name: i.menu_item?.name || 'Item', 
              notes: i.special_instructions || '' 
            })),
            total_amount: o.total_amount,
            tax_amount: 0,
            tip_amount: 0,
            delivery_address: o.delivery_address,
            table_number: o.table_number,
            notes: o.notes,
            restaurant_id: o.restaurant_id,
            created_at: o.created_at,
            updated_at: o.updated_at,
            estimated_delivery: o.estimated_delivery,
            actual_delivery: o.actual_delivery,
          };
          
          // Add new order to the beginning of the list
          setOrders(prev => [newOrder, ...prev]);
          
          // Update stats automatically
          setOrderStats(prev => ({
            ...prev,
            total: prev.total + 1,
            pending: prev.pending + (newOrder.status === 'pending' ? 1 : 0),
            totalRevenue: prev.totalRevenue + newOrder.total_amount,
            averageOrderValue: (prev.totalRevenue + newOrder.total_amount) / (prev.total + 1)
          }));
          
          // Show notification
          toast({ 
            title: 'New Order Received!', 
            description: `Order #${newOrder.id.slice(-8)} from ${newOrder.customer_name}`,
          });
          
          // Play notification sound
          try { 
            if (audioRef.current) {
              audioRef.current.play();
            }
          } catch {}
          
        } else if (payload.eventType === 'UPDATE') {
          const u: any = payload.new;
          
          console.log('Real-time UPDATE received:', { orderId: u.id, newStatus: u.status });
          
          // Update existing order in the list and stats atomically
          setOrders(prev => {
            const updatedOrders = prev.map(order => 
              order.id === u.id ? { ...order, ...u } : order
            );
            
            // Update stats based on the new orders state
            const newPending = updatedOrders.filter(o => o.status === 'pending').length;
            setOrderStats(prevStats => ({
              ...prevStats,
              pending: newPending
            }));
            
            return updatedOrders;
          });
          
          // Show status update notification
          toast({ 
            title: 'Order Updated', 
            description: `Order #${u.id.slice(-8)} status: ${u.status}`,
          });
          
        } else if (payload.eventType === 'DELETE') {
          const d: any = payload.old;
          
          // Remove deleted order from the list
          setOrders(prev => prev.filter(o => o.id !== d.id));
          
          // Update stats
          setOrderStats(prev => {
            const newTotal = Math.max(0, prev.total - 1);
            const newRevenue = Math.max(0, prev.totalRevenue - (d.total_amount || 0));
            return {
              ...prev,
              total: newTotal,
              totalRevenue: newRevenue,
              averageOrderValue: newTotal > 0 ? newRevenue / newTotal : 0
            };
          });
          
          toast({ 
            title: 'Order Removed', 
            description: `Order #${d.id.slice(-8)} has been removed`,
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, async (payload) => {
        // Handle order items changes (for when items are added/removed/modified)
        console.log('Real-time order item update:', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          // Refresh the affected order to show updated items
          const orderId = payload.eventType === 'DELETE' ? payload.old.order_id : payload.new.order_id;
          
          if (orderId) {
            const { data: updatedOrder } = await supabase
              .from('orders')
              .select(`
                *,
                order_items (
                  id,
                  quantity,
                  unit_price,
                  special_instructions,
                  menu_item:menu_items(name)
                )
              `)
              .eq('id', orderId)
              .single();
            
            if (updatedOrder) {
              setOrders(prev => prev.map(order => 
                order.id === orderId ? {
                  ...order,
                  items: (updatedOrder.order_items || []).map((i: any) => ({ 
                    id: i.id, 
                    quantity: i.quantity, 
                    price: i.unit_price, 
                    menu_item_name: i.menu_item?.name || 'Item', 
                    notes: i.special_instructions || '' 
                  }))
                } : order
              ));
            }
          }
        }
      })
      .subscribe();

    return () => { 
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel); 
    };
  }, [user?.restaurant_id, toast]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    const matchesType = selectedType === "all" || order.order_type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "preparing":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "ready":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "preparing":
        return <AlertCircle className="h-4 w-4" />;
      case "ready":
        return <Package className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      console.log('Updating order status:', { orderId, newStatus });
      setUpdatingId(orderId);
      
      // Update the order status in the database
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);
      
      if (error) {
        throw error;
      }
      
      console.log('Database update successful, waiting for real-time update...');
      
      // The real-time subscription will automatically update the UI
      // But let's also update the local state immediately as a fallback
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order
      ));
      
      // Update stats immediately - recalculate pending count
      setOrderStats(prev => {
        const currentOrders = orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        );
        const newPending = currentOrders.filter(o => o.status === 'pending').length;
        return { ...prev, pending: newPending };
      });
      
      toast({
        title: "Order Status Updated",
        description: `Order #${orderId.slice(-8)} status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case "dine_in":
        return <MapPin className="h-4 w-4" />;
      case "takeaway":
        return <Package className="h-4 w-4" />;
      case "delivery":
        return <Timer className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout userRole="restaurant_manager">
      <div className="space-y-6">
        <audio ref={audioRef as any} hidden />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
            <p className="text-muted-foreground">
              Track and manage all incoming orders from your restaurant
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print Orders
            </Button>
            <LogoutButton variant="outline" />
          </div>
        </div>

        {/* Connection Status */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${user?.restaurant_id ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <div>
                  <h3 className="font-medium text-blue-800">Connection Status</h3>
                  <p className="text-sm text-blue-700">
                    {user?.restaurant_id ? 
                      `Connected to restaurant: ${user.restaurant_id.slice(0, 8)}...` : 
                      'Setting up restaurant...'
                    }
                  </p>
                </div>
              </div>
              <div className="text-sm text-blue-600">
                Live Mode
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Database Setup Alert */}
          {!user?.restaurant_id && (
            <div className="col-span-full">
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-200">
                          Database Setup Required
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-300">
                          Your restaurant profile is not properly linked. Click the button to fix this.
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          await simpleSetupDatabase();
                          toast({
                            title: "Database Setup",
                            description: "Database setup completed! The page will reload shortly.",
                          });
                        } catch (error) {
                          toast({
                            title: "Setup Failed",
                            description: "Database setup failed. Please try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Setup Database"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderStats.total}</div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderStats.pending}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(orderStats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">All time revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(orderStats.averageOrderValue)}</div>
              <p className="text-xs text-muted-foreground">Per order</p>
            </CardContent>
          </Card>
        </div>

        {/* Restaurant Setup Alert */}
        {!user?.restaurant_id && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <h3 className="font-medium text-orange-800">Setting Up Restaurant</h3>
                    <p className="text-sm text-orange-700">
                      Creating your restaurant configuration. This may take a moment...
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-orange-600">Setting up...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search orders by customer, order ID, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dine_in">Dine In</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin mr-3 text-blue-600" />
                <span className="text-lg font-medium">Loading orders...</span>
              </div>
              <p className="text-gray-500 text-center mb-6">
                This may take a few moments. If it takes too long, there might be a connection issue.
              </p>
              <div className="text-sm text-gray-400 text-center mb-6">
                <p>• Checking restaurant configuration...</p>
                <p>• Connecting to database...</p>
                <p>• Fetching order data...</p>
                <p>• Current restaurant: {user?.restaurant_id ? `${user.restaurant_id.slice(0, 8)}...` : 'None'}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsLoading(false);
                  toast({
                    title: "Loading Cancelled",
                    description: "You can try refreshing or check the connection.",
                  });
                }}
              >
                Cancel Loading
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-gray-500 text-center mb-4">
                Orders will appear here when customers place them.
              </p>
              <div className="text-sm text-gray-400 text-center mb-6">
                <p>• Make sure your restaurant is properly configured</p>
                <p>• Check that customers can access your menu</p>
                <p>• Verify your Supabase connection is working</p>
                <p>• Current restaurant ID: {user?.restaurant_id || 'None'}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Open the customer menu page in a new tab to test ordering
                    const menuUrl = `${window.location.origin}/menu?restaurant=${user?.restaurant_id}`;
                    window.open(menuUrl, '_blank');
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Customer Menu
                </Button>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      // Create a test order
                      const { data: order, error: orderError } = await supabase
                        .from('orders')
                        .insert({
                          customer_name: 'Test Customer',
                          customer_email: 'test@example.com',
                          customer_phone: '+1-555-0123',
                          order_type: 'dine_in',
                          status: 'pending',
                          total_amount: 25.99,
                          restaurant_id: user?.restaurant_id,
                          notes: 'Test order for development'
                        })
                        .select()
                        .single();
                      
                      if (orderError) throw orderError;
                      
                      // Create test order items
                      await supabase
                        .from('order_items')
                        .insert({
                          order_id: order.id,
                          menu_item_id: 'test-item-id',
                          quantity: 2,
                          unit_price: 12.99,
                          total_price: 25.98
                        });
                      
                      toast({
                        title: "Test Order Created",
                        description: "A test order has been created. Refresh to see it!",
                      });
                      
                      // Refresh the page to show the new order
                      window.location.reload();
                    } catch (e) {
                      console.error('Failed to create test order:', e);
                      toast({
                        title: "Error",
                        description: "Failed to create test order. Please check your database setup.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Create Test Order
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">#{order.id}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                        <Badge variant="outline">
                          {getOrderTypeIcon(order.order_type)}
                          <span className="ml-1 capitalize">{order.order_type.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{order.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{order.customer_phone}</span>
                        </div>
                        {order.table_number && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>Table {order.table_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{formatCurrency(order.total_amount)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(order.created_at)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Order Items</h4>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.menu_item_name}
                              {item.notes && <span className="text-muted-foreground"> — {item.notes}</span>}
                            </span>
                            <span>{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div>
                        <h4 className="font-medium mb-1">Notes</h4>
                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                      </div>
                    )}

                    {order.delivery_address && (
                      <div>
                        <h4 className="font-medium mb-1">Delivery Address</h4>
                        <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        <div>Tax: {formatCurrency(order.tax_amount)}</div>
                        <div>Tip: {formatCurrency(order.tip_amount)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Order Details - #{order.id}</DialogTitle>
                              <DialogDescription>
                                Complete order information and customer details
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Customer Information</h4>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Name:</strong> {order.customer_name}</div>
                                    <div><strong>Email:</strong> {order.customer_email}</div>
                                    <div><strong>Phone:</strong> {order.customer_phone}</div>
                                    {order.delivery_address && (
                                      <div><strong>Address:</strong> {order.delivery_address}</div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Order Information</h4>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Type:</strong> {order.order_type.replace('_', ' ')}</div>
                                    <div><strong>Status:</strong> {order.status}</div>
                                    <div><strong>Created:</strong> {formatDate(order.created_at)} at {formatTime(order.created_at)}</div>
                                    <div><strong>Updated:</strong> {formatDate(order.updated_at)} at {formatTime(order.updated_at)}</div>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Order Items</h4>
                                <div className="space-y-2">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="p-2 bg-muted rounded">
                                      <div className="flex justify-between items-center">
                                        <div className="font-medium">{item.menu_item_name}</div>
                                        <div className="text-right">
                                          <div className="font-medium">{formatCurrency(item.price * item.quantity)}</div>
                                          <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                                        </div>
                                      </div>
                                      {item.notes && (
                                        <div className="text-sm text-muted-foreground mt-1">Notes: {item.notes}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="border-t pt-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-semibold">Total</span>
                                  <span className="text-lg font-semibold">{formatCurrency(order.total_amount)}</span>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {order.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateOrderStatus(order.id, "confirmed")} disabled={updatingId===order.id}>
                          Confirm Order
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "cancelled")} disabled={updatingId===order.id}>
                          Cancel Order
                        </Button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "preparing")} disabled={updatingId===order.id}>
                        Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "ready")} disabled={updatingId===order.id}>
                        Mark Ready
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "completed")} disabled={updatingId===order.id}>
                        Complete Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedStatus !== "all" || selectedType !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Orders will appear here when customers place them."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
} 