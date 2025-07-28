import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Eye, 
  MessageSquare, 
  Phone, 
  MapPin,
  RefreshCw,
  Bell,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

interface Order {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  table_number: string;
  notes?: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  order_type: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  menu_item?: {
    name: string;
    description: string;
  };
}

interface RestaurantDashboardProps {
  restaurantId: string;
}

export default function RestaurantDashboard({ restaurantId }: RestaurantDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [realTimeSubscription, setRealTimeSubscription] = useState<any>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    totalRevenue: 0
  });
  const { toast } = useToast();

  // Load initial orders
  useEffect(() => {
    loadOrders();
    setupRealTimeSubscription();
  }, [restaurantId]);

  // Cleanup subscription
  useEffect(() => {
    return () => {
      if (realTimeSubscription) {
        realTimeSubscription.unsubscribe();
      }
    };
  }, [realTimeSubscription]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('Loading orders for restaurant:', restaurantId);
      
      // Fetch orders for this restaurant
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_item:menu_items (
              name,
              description
            )
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive",
        });
        return;
      }

      console.log('Loaded orders:', ordersData);
      
      // Log the status of each order
      if (ordersData) {
        ordersData.forEach(order => {
          console.log(`Order ${order.id.slice(-8)}: status = ${order.status}`);
        });
      }
      
      setOrders(ordersData || []);
      updateStats(ordersData || []);
      
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscription = () => {
    console.log('Setting up real-time subscription for restaurant:', restaurantId);
    
    const subscription = supabase
      .channel(`restaurant-orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log('Real-time order update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // New order received
            const newOrder = payload.new as Order;
            setOrders(prev => [newOrder, ...prev]);
            updateStats([newOrder, ...orders]);
            
            toast({
              title: "New Order!",
              description: `Order #${newOrder.id.slice(-8)} from ${newOrder.customer_name}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            // Order status updated - only update if it's not our own update
            const updatedOrder = payload.new as Order;
            console.log('Real-time UPDATE received for order:', updatedOrder.id, 'new status:', updatedOrder.status);
            
            // Skip real-time updates if we're currently updating an order
            if (isUpdatingOrder) {
              console.log('Skipping real-time update - currently updating order');
              return;
            }
            
            setOrders(prev => {
              const updatedOrders = prev.map(order => 
                order.id === updatedOrder.id ? updatedOrder : order
              );
              
              // Update stats with the updated orders list
              updateStats(updatedOrders);
              
              return updatedOrders;
            });
            
            toast({
              title: "Order Updated",
              description: `Order #${updatedOrder.id.slice(-8)} status: ${updatedOrder.status}`,
            });
          }
        }
      )
      .subscribe();

    setRealTimeSubscription(subscription);
  };

  const updateStats = (ordersList: Order[]) => {
    const stats = {
      totalOrders: ordersList.length,
      pendingOrders: ordersList.filter(o => o.status === 'pending').length,
      preparingOrders: ordersList.filter(o => o.status === 'preparing').length,
      readyOrders: ordersList.filter(o => o.status === 'ready').length,
      totalRevenue: ordersList.reduce((sum, order) => sum + order.total_amount, 0)
    };
    setStats(stats);
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      console.log('updateOrderStatus called with:', { orderId, newStatus });
      
      // Set flag to prevent real-time interference
      setIsUpdatingOrder(true);
      
      // Get current order to know the previous status for better error handling
      const currentOrder = orders.find(order => order.id === orderId);
      if (!currentOrder) {
        console.error('Order not found in local state:', orderId);
        setIsUpdatingOrder(false);
        return;
      }
      
      const previousStatus = currentOrder.status;
      console.log('Current order status:', previousStatus, 'Updating to:', newStatus);
      
      // Optimistically update the local state first for better UX
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
            : order
        );
        
        // Update stats immediately
        updateStats(updatedOrders);
        
        return updatedOrders;
      });
      
      // Then update the database
      const { data: updateResult, error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select();

      if (error) {
        console.error('Error updating order status:', error);
        
        // Revert the optimistic update on error
        setOrders(prevOrders => {
          const revertedOrders = prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: previousStatus, updated_at: new Date().toISOString() }
              : order
          );
          
          // Update stats with reverted orders
          updateStats(revertedOrders);
          
          return revertedOrders;
        });
        
        toast({
          title: "Error",
          description: "Failed to update order status",
          variant: "destructive",
        });
        return;
      }

      console.log('Order status updated successfully:', updateResult);
      
      toast({
        title: "Status Updated",
        description: `Order status updated to ${newStatus}`,
      });

    } catch (error) {
      console.error('Error updating order status:', error);
      
      // Revert the optimistic update on error
      setOrders(prevOrders => {
        const revertedOrders = prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: previousStatus, updated_at: new Date().toISOString() }
            : order
        );
        
        // Update stats with reverted orders
        updateStats(revertedOrders);
        
        return revertedOrders;
      });
      
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      // Always clear the flag
      setIsUpdatingOrder(false);
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'preparing':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout userRole="restaurant_manager">
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Restaurant Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time order management</p>
        </div>
        <div className="flex items-center gap-2">
          {realTimeSubscription && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 dark:text-green-400 font-medium">LIVE</span>
            </div>
          )}
          <Button onClick={loadOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Preparing</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.preparingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ready</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.readyOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="preparing">Preparing</TabsTrigger>
          <TabsTrigger value="ready">Ready</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'preparing', 'ready', 'completed'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">Loading orders...</p>
                </div>
              ) : orders.filter(order => tab === 'all' || order.status === tab).length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No {tab} orders</p>
                </div>
              ) : (
                orders
                  .filter(order => tab === 'all' || order.status === tab)
                  .map((order) => (
                    <Card key={order.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(order.status)}
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                Order #{order.id.slice(-8)}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {order.customer_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Table {order.table_number}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              ${order.total_amount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <MessageSquare className="h-4 w-4 inline mr-2" />
                              {order.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {order.customer_phone}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                disabled={updatingOrderId === order.id}
                                onClick={() => {
                                  console.log('Confirm Order button clicked for order:', order.id);
                                  setUpdatingOrderId(order.id);
                                  updateOrderStatus(order.id, 'confirmed').finally(() => {
                                    setUpdatingOrderId(null);
                                  });
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                {updatingOrderId === order.id ? 'Updating...' : 'Confirm Order'}
                              </Button>
                            )}
                            {order.status === 'confirmed' && (
                              <Button
                                size="sm"
                                disabled={updatingOrderId === order.id}
                                onClick={() => {
                                  console.log('Start Preparing button clicked for order:', order.id);
                                  setUpdatingOrderId(order.id);
                                  updateOrderStatus(order.id, 'preparing').finally(() => {
                                    setUpdatingOrderId(null);
                                  });
                                }}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                {updatingOrderId === order.id ? 'Updating...' : 'Start Preparing'}
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button
                                size="sm"
                                disabled={updatingOrderId === order.id}
                                onClick={() => {
                                  setUpdatingOrderId(order.id);
                                  updateOrderStatus(order.id, 'ready').finally(() => {
                                    setUpdatingOrderId(null);
                                  });
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white"
                              >
                                {updatingOrderId === order.id ? 'Updating...' : 'Mark Ready'}
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button
                                size="sm"
                                disabled={updatingOrderId === order.id}
                                onClick={() => {
                                  setUpdatingOrderId(order.id);
                                  updateOrderStatus(order.id, 'completed').finally(() => {
                                    setUpdatingOrderId(null);
                                  });
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                {updatingOrderId === order.id ? 'Updating...' : 'Complete'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Order Information</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Order #{selectedOrder.id.slice(-8)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Created: {formatDate(selectedOrder.created_at)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status: {selectedOrder.status}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Customer Information</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Name: {selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {selectedOrder.customer_phone}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Table: {selectedOrder.table_number}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Special Instructions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.menu_item?.name || 'Unknown Item'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                        </p>
                        {item.special_instructions && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Note: {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        ${item.total_price.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ${selectedOrder.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedOrder.status === 'pending' && (
                  <Button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'preparing');
                      setShowOrderDetails(false);
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Start Preparing
                  </Button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <Button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'ready');
                      setShowOrderDetails(false);
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    Mark Ready
                  </Button>
                )}
                {selectedOrder.status === 'ready' && (
                  <Button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'completed');
                      setShowOrderDetails(false);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Complete Order
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
                 </DialogContent>
       </Dialog>
     </div>
     </AdminLayout>
   );
 }