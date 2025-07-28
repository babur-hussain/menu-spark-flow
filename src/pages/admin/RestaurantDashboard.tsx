<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
<<<<<<< HEAD
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { restaurantAnalyticsService, RestaurantAnalytics, RestaurantStats, RestaurantOrder } from "@/lib/restaurantAnalytics";
import { useAuth } from "@/contexts/AuthContext";
=======
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
import {
  BarChart3,
  TrendingUp,
  Users,
  UtensilsCrossed,
  DollarSign,
  Clock,
  Star,
  QrCode,
  AlertCircle,
  CheckCircle,
<<<<<<< HEAD
  Loader2,
} from "lucide-react";

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantData, setRestaurantData] = useState<RestaurantAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!user?.id) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching restaurant data for user:', user.id);
        const data = await restaurantAnalyticsService.getRestaurantData(user.id);
        
        console.log('Restaurant data received:', data);
        
        if (data) {
          setRestaurantData(data);
        } else {
          setError('No restaurant found for this user');
        }
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
        setError('Failed to load restaurant data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <AdminLayout userRole="restaurant_manager">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading restaurant data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !restaurantData) {
    return (
      <AdminLayout userRole="restaurant_manager">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-destructive">{error || 'No restaurant data available'}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please contact support if this issue persists.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const quickStats = [
    { 
      label: "Today's Orders", 
      value: (restaurantData.stats?.todayOrders || 0).toString(), 
      change: "+12%", 
      icon: UtensilsCrossed, 
      color: "text-blue-500" 
    },
    { 
      label: "Today's Revenue", 
      value: `$${(restaurantData.stats?.todayRevenue || 0).toLocaleString()}`, 
      change: "+8%", 
      icon: DollarSign, 
      color: "text-green-500" 
    },
    { 
      label: "Avg. Order Time", 
      value: `${restaurantData.stats?.avgOrderTime || 0} min`, 
      change: "-3 min", 
      icon: Clock, 
      color: "text-orange-500" 
    },
    { 
      label: "Customer Rating", 
      value: (restaurantData.stats?.customerRating || 0).toString(), 
      change: "+0.2", 
      icon: Star, 
      color: "text-yellow-500" 
    },
  ];

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "ready":
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Ready</Badge>;
      case "preparing":
        return <Badge variant="outline" className="border-orange-500 text-orange-700"><Clock className="w-3 h-3 mr-1" />Preparing</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="border-blue-500 text-blue-700"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  try {
    return (
      <AdminLayout userRole="restaurant_manager" restaurantName={restaurantData.stats?.name || 'Restaurant'}>
        <div className="space-y-6">
=======
} from "lucide-react";

export default function RestaurantDashboard() {
  const restaurantData = {
    name: "Bella Vista Restaurant",
    totalOrders: 1247,
    revenue: 48750,
    avgRating: 4.8,
    activeMenuItems: 45,
    recentOrders: [
      { id: "#ORD-001", table: "Table 5", items: 3, total: 67.50, status: "preparing", time: "5 min ago" },
      { id: "#ORD-002", table: "Table 2", items: 2, total: 34.25, status: "ready", time: "8 min ago" },
      { id: "#ORD-003", table: "Table 8", items: 4, total: 89.75, status: "completed", time: "12 min ago" },
    ],
    quickStats: [
      { label: "Today's Orders", value: "47", change: "+12%", icon: UtensilsCrossed, color: "text-blue-500" },
      { label: "Today's Revenue", value: "$1,240", change: "+8%", icon: DollarSign, color: "text-green-500" },
      { label: "Avg. Order Time", value: "18 min", change: "-3 min", icon: Clock, color: "text-orange-500" },
      { label: "Customer Rating", value: "4.8", change: "+0.2", icon: Star, color: "text-yellow-500" },
    ],
  };

  return (
    <AdminLayout userRole="restaurant_manager" restaurantName={restaurantData.name}>
      <div className="space-y-6">
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
<<<<<<< HEAD
              Here's what's happening at {restaurantData.stats?.name || 'your restaurant'} today.
=======
              Here's what's happening at {restaurantData.name} today.
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <QrCode className="w-4 h-4 mr-2" />
              Generate QR
            </Button>
            <Button>View Reports</Button>
<<<<<<< HEAD
            <LogoutButton variant="outline" />
=======
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
<<<<<<< HEAD
          {quickStats.map((stat, index) => (
=======
          {restaurantData.quickStats.map((stat, index) => (
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">{stat.change}</span> from yesterday
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Orders */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from your restaurant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
<<<<<<< HEAD
                {!restaurantData.recentOrders || restaurantData.recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent orders
                  </div>
                ) : (
                  restaurantData.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">#{order.id.slice(-6)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name} • {order.order_type.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">{order.items_count} items</p>
                          <p className="text-sm text-muted-foreground">{formatTimeAgo(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">${order.total_amount.toFixed(2)}</p>
                          {getStatusBadge(order.status)}
                        </div>
                        <Button size="sm">View</Button>
                      </div>
                    </div>
                  ))
                )}
=======
                {restaurantData.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.table}</p>
                      </div>
                      <div>
                        <p className="text-sm">{order.items} items</p>
                        <p className="text-sm text-muted-foreground">{order.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">${order.total}</p>
                        <Badge 
                          variant={
                            order.status === "completed" ? "default" :
                            order.status === "ready" ? "secondary" : "outline"
                          }
                          className="capitalize"
                        >
                          {order.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {order.status === "preparing" && <Clock className="w-3 h-3 mr-1" />}
                          {order.status === "ready" && <AlertCircle className="w-3 h-3 mr-1" />}
                          {order.status}
                        </Badge>
                      </div>
                      <Button size="sm">View</Button>
                    </div>
                  </div>
                ))}
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your restaurant efficiently</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                Add New Menu Item
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <QrCode className="w-4 h-4 mr-2" />
                Generate Table QR Codes
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Manage Staff
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Star className="w-4 h-4 mr-2" />
                Check Reviews
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics Overview</CardTitle>
            <CardDescription>Your restaurant performance at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today" className="w-full">
              <TabsList>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
<<<<<<< HEAD
                    <div className="text-2xl font-bold text-blue-500">{restaurantData.stats?.todayOrders || 0}</div>
                    <p className="text-sm text-muted-foreground">Orders Today</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">${(restaurantData.stats?.todayRevenue || 0).toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Revenue Today</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">{restaurantData.stats?.avgOrderTime || 0} min</div>
                    <p className="text-sm text-muted-foreground">Avg Order Time</p>
                  </div>
                </div>
                
                {/* Daily Analytics Chart */}
                <AnalyticsChart
                  title="Daily Orders"
                  description="Orders over the last 7 days"
                  data={restaurantData.dailyStats?.map(item => ({ month: item.date, value: item.orders })) || []}
                  valueKey="orders"
                  color="#3b82f6"
                  formatValue={(value) => value.toString()}
                />
              </TabsContent>
              <TabsContent value="week">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">
                        {restaurantData.weeklyStats?.reduce((sum, week) => sum + week.orders, 0) || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Orders This Week</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-500">
                        ${(restaurantData.weeklyStats?.reduce((sum, week) => sum + week.revenue, 0) || 0).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Revenue This Week</p>
                    </div>
                  </div>
                  
                  <AnalyticsChart
                    title="Weekly Orders"
                    description="Orders over the last 4 weeks"
                    data={restaurantData.weeklyStats?.map(item => ({ month: item.week, value: item.orders })) || []}
                    valueKey="orders"
                    color="#10b981"
                    formatValue={(value) => value.toString()}
                  />
                </div>
              </TabsContent>
              <TabsContent value="month">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">
                        {restaurantData.monthlyStats?.reduce((sum, month) => sum + month.orders, 0) || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Orders This Month</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-500">
                        ${(restaurantData.monthlyStats?.reduce((sum, month) => sum + month.revenue, 0) || 0).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Revenue This Month</p>
                    </div>
                  </div>
                  
                  <AnalyticsChart
                    title="Monthly Orders"
                    description="Orders over the last 6 months"
                    data={restaurantData.monthlyStats?.map(item => ({ month: item.month, value: item.orders })) || []}
                    valueKey="orders"
                    color="#8b5cf6"
                    formatValue={(value) => value.toString()}
                  />
=======
                    <div className="text-2xl font-bold text-blue-500">47</div>
                    <p className="text-sm text-muted-foreground">Orders Today</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">$1,240</div>
                    <p className="text-sm text-muted-foreground">Revenue Today</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">18 min</div>
                    <p className="text-sm text-muted-foreground">Avg Order Time</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="week">
                <div className="text-center py-8 text-muted-foreground">
                  Weekly analytics would be displayed here
                </div>
              </TabsContent>
              <TabsContent value="month">
                <div className="text-center py-8 text-muted-foreground">
                  Monthly analytics would be displayed here
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
<<<<<<< HEAD
  } catch (error) {
    console.error('Error rendering RestaurantDashboard:', error);
    return (
      <AdminLayout userRole="restaurant_manager">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-destructive">Something went wrong while rendering the dashboard.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please refresh the page or contact support.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }
=======
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
}