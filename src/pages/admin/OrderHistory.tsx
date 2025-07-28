import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Filter, 
  Calendar,
  User,
  MapPin,
  Printer,
  Eye,
  Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { orderHistoryService, OrderHistoryEntry } from '@/lib/orderHistoryService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';

export default function OrderHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderHistoryEntry[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryEntry | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    loadOrderHistory();
  }, [user]);

  const loadOrderHistory = async () => {
    try {
      setLoading(true);
      
      let ordersData: OrderHistoryEntry[];
      let statsData: any;

      if (user?.role === 'super_admin') {
        ordersData = await orderHistoryService.getAllOrderHistory();
        statsData = await orderHistoryService.getOrderHistoryStats();
      } else {
        ordersData = await orderHistoryService.getRestaurantOrderHistory(user?.restaurant_id || '');
        statsData = await orderHistoryService.getOrderHistoryStats(user?.restaurant_id);
      }

      setOrders(ordersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading order history:', error);
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const generateBill = (order: OrderHistoryEntry) => {
    const billWindow = window.open('', '_blank', 'width=800,height=600');
    if (!billWindow) return;

    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - Order #${order.id.slice(-8)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .restaurant-name { font-size: 24px; font-weight: bold; }
          .order-info { margin-bottom: 20px; }
          .items { margin-bottom: 20px; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 1px solid #ccc; padding-top: 10px; font-weight: bold; font-size: 18px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">${order.restaurant_name}</div>
          <div>Order #${order.id.slice(-8)}</div>
          <div>${new Date(order.created_at).toLocaleString()}</div>
        </div>
        
        <div class="order-info">
          <div><strong>Customer:</strong> ${order.customer_name}</div>
          <div><strong>Email:</strong> ${order.customer_email}</div>
          <div><strong>Phone:</strong> ${order.customer_phone}</div>
          <div><strong>Table:</strong> ${order.table_number || 'N/A'}</div>
          <div><strong>Status:</strong> ${order.status}</div>
        </div>
        
        <div class="items">
          <h3>Order Items:</h3>
          ${(order.items || []).map((item: any) => `
            <div class="item">
              <span>${item.quantity}x ${item.name || item.menu_item_name}</span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="total">
          <div class="item">
            <span>Subtotal:</span>
            <span>$${(order.total_amount - order.tax_amount - order.tip_amount).toFixed(2)}</span>
          </div>
          <div class="item">
            <span>Tax:</span>
            <span>$${order.tax_amount.toFixed(2)}</span>
          </div>
          <div class="item">
            <span>Tip:</span>
            <span>$${order.tip_amount.toFixed(2)}</span>
          </div>
          <div class="item">
            <span>Total Amount:</span>
            <span>$${order.total_amount.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    billWindow.document.write(billHTML);
    billWindow.document.close();
    billWindow.focus();
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Table', 'Status', 'Total', 'Created', 'Completed'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.id,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.table_number || 'N/A',
        order.status,
        order.total_amount,
        new Date(order.created_at).toLocaleString(),
        order.completed_at ? new Date(order.completed_at).toLocaleString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'ready': return 'bg-blue-500';
      case 'preparing': return 'bg-yellow-500';
      case 'confirmed': return 'bg-orange-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  if (loading) {
    return (
      <AdminLayout userRole={user?.role || 'restaurant_manager'}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading order history...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userRole={user?.role || 'restaurant_manager'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
            <p className="text-muted-foreground">
              View and manage all past orders
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
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
              <div className="text-2xl font-bold">{stats.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                All time orders
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed || 0}</div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
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
                ${(stats.totalRevenue || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                All time revenue
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bills Generated</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.billGeneratedCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Bills created
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders by customer, email, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
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
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? "Try adjusting your search or filter criteria."
                    : "Orders will appear here once they are completed."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Order #{order.id.slice(-8)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)} at {formatTime(order.created_at)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${order.total_amount.toFixed(2)}</div>
                      <p className="text-sm text-muted-foreground">
                        {order.items?.length || 0} items
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{order.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Table {order.table_number || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{order.order_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Printer className="h-4 w-4 text-muted-foreground" />
                      <span>{order.bill_generated ? 'Bill Generated' : 'No Bill'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {(order.status === 'completed' || order.status === 'ready') && (
                      <Button
                        size="sm"
                        onClick={() => generateBill(order)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Generate Bill
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Order Details Dialog */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details - #{selectedOrder?.id.slice(-8)}</DialogTitle>
              <DialogDescription>
                Complete order information and customer details
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Name:</strong> {selectedOrder.customer_name}</div>
                      <div><strong>Email:</strong> {selectedOrder.customer_email}</div>
                      <div><strong>Phone:</strong> {selectedOrder.customer_phone}</div>
                      <div><strong>Table:</strong> {selectedOrder.table_number || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Order Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Type:</strong> {selectedOrder.order_type.replace('_', ' ')}</div>
                      <div><strong>Status:</strong> {selectedOrder.status}</div>
                      <div><strong>Created:</strong> {formatDate(selectedOrder.created_at)} at {formatTime(selectedOrder.created_at)}</div>
                      {selectedOrder.completed_at && (
                        <div><strong>Completed:</strong> {formatDate(selectedOrder.completed_at)} at {formatTime(selectedOrder.completed_at)}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium">{item.name || item.menu_item_name}</div>
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
                    <span className="text-lg font-semibold">${selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 