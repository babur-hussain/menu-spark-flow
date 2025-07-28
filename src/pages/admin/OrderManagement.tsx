import { useState, useEffect } from "react";
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
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/contexts/AuthContext";
import { orderService, Order, OrderItem } from "@/lib/orderService";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.restaurant_id) return;
      
      try {
        setIsLoading(true);
        const [ordersData, statsData] = await Promise.all([
          orderService.getOrders(user.restaurant_id),
          orderService.getOrdersStats(user.restaurant_id),
        ]);
        setOrders(ordersData);
        setOrderStats(statsData);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user?.restaurant_id, toast]);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(order => 
        order.id === orderId ? updatedOrder : order
      ));
      toast({
        title: "Order Status Updated",
        description: `Order ${orderId} status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderStats.total}</div>
              <p className="text-xs text-muted-foreground">
                All time orders
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderStats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${orderStats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                All time revenue
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${orderStats.averageOrderValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per order
              </p>
            </CardContent>
          </Card>
        </div>

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
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          </div>
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
                      <div className="text-2xl font-bold">${order.total_amount.toFixed(2)}</div>
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
                            <span>{item.quantity}x {item.menu_item_name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
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
                        <div>Tax: ${order.tax_amount.toFixed(2)}</div>
                        <div>Tip: ${order.tip_amount.toFixed(2)}</div>
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
                                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                      <div>
                                        <div className="font-medium">{item.menu_item_name}</div>
                                        {item.notes && <div className="text-sm text-muted-foreground">{item.notes}</div>}
                                      </div>
                                      <div className="text-right">
                                        <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                                        <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="border-t pt-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-semibold">Total</span>
                                  <span className="text-lg font-semibold">${order.total_amount.toFixed(2)}</span>
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
                        <Button size="sm" onClick={() => updateOrderStatus(order.id, "confirmed")}>
                          Confirm Order
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "cancelled")}>
                          Cancel Order
                        </Button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "preparing")}>
                        Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "ready")}>
                        Mark Ready
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "completed")}>
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