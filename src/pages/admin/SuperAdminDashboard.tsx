import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { analyticsService, DashboardStats, Restaurant, SystemActivity } from "@/lib/analytics";
import { populateSampleData } from "@/lib/sampleData";
import { AddRestaurantModal } from "@/components/admin/AddRestaurantModal";
import {
  Building,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  MoreVertical,
  MapPin,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRestaurants: 0,
    totalUsers: 0,
    totalRevenue: 0,
    growthRate: 0
  });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [orderData, setOrderData] = useState<{ month: string; orders: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addRestaurantOpen, setAddRestaurantOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const analyticsData = await analyticsService.getAllAnalyticsData();
        
        setStats(analyticsData.stats);
        setRestaurants(analyticsData.restaurants);
        setActivities(analyticsData.activities);
        setRevenueData(analyticsData.revenueData);
        setOrderData(analyticsData.orderData);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const quickStats = [
    { label: "Total Restaurants", value: stats.totalRestaurants, change: "+8", icon: Building, color: "text-blue-500" },
    { label: "Total Users", value: stats.totalUsers, change: "+124", icon: Users, color: "text-green-500" },
    { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, change: "+12.5%", icon: DollarSign, color: "text-purple-500" },
    { label: "Growth Rate", value: `${stats.growthRate}%`, change: "+2.1%", icon: TrendingUp, color: "text-orange-500" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const handleRestaurantAdded = () => {
    // Refresh the data after adding a restaurant
    const refreshData = async () => {
      try {
        setIsLoading(true);
        const analyticsData = await analyticsService.getAllAnalyticsData();
        
        setStats(analyticsData.stats);
        setRestaurants(analyticsData.restaurants);
        setActivities(analyticsData.activities);
        setRevenueData(analyticsData.revenueData);
        setOrderData(analyticsData.orderData);
      } catch (error) {
        console.error('Error refreshing analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    refreshData();
  };

    if (isLoading) {
    return (
      <AdminLayout userRole="super_admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userRole="super_admin">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
            <p className="text-muted-foreground">
              Manage all restaurants and monitor platform performance.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Export Data</Button>
            <Button 
              onClick={() => {
                console.log('Add Restaurant button clicked');
                setAddRestaurantOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Restaurant
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (confirm('This will populate the database with sample data. Continue?')) {
                  populateSampleData();
                }
              }}
            >
              Populate Sample Data
            </Button>
            <LogoutButton variant="outline" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Restaurant Management */}
          <Card className="col-span-5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Restaurant Management</CardTitle>
                  <CardDescription>Manage all registered restaurants</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search restaurants..." 
                      className="pl-8 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRestaurants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No restaurants found matching your search.' : 'No restaurants found.'}
                  </div>
                ) : (
                  filteredRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold">
                        {restaurant.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{restaurant.name}</p>
                          {getStatusBadge(restaurant.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Owner: {restaurant.owner}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1" />
                          {restaurant.location}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(restaurant.joinDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium">${restaurant.monthlyRevenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{restaurant.orders}</p>
                        <p className="text-xs text-muted-foreground">Total Orders</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-500 mr-1" />
                          <p className="text-sm font-medium">{restaurant.rating}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No recent activities
                </div>
              ) : (
                activities.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === "new_restaurant" ? "bg-blue-500" :
                      activity.type === "payment" ? "bg-green-500" :
                      activity.type === "issue" ? "bg-red-500" : 
                      activity.type === "order" ? "bg-purple-500" : "bg-gray-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <AnalyticsChart
            title="Revenue Analytics"
            description="Monthly revenue trends"
            data={revenueData.map(item => ({ month: item.month, value: item.revenue }))}
            valueKey="revenue"
            color="#8b5cf6"
            formatValue={(value) => `$${value.toLocaleString()}`}
          />
          
          <AnalyticsChart
            title="Order Analytics"
            description="Monthly order trends"
            data={orderData.map(item => ({ month: item.month, value: item.orders }))}
            valueKey="orders"
            color="#06b6d4"
            formatValue={(value) => value.toString()}
          />
        </div>

        {/* System Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>System Analytics</CardTitle>
            <CardDescription>Platform performance and usage statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">{stats.totalRestaurants}</div>
                    <p className="text-sm text-muted-foreground">Total Restaurants</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{stats.totalUsers}</div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-500">${(stats.totalRevenue / 1000).toFixed(1)}K</div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">{stats.growthRate}%</div>
                    <p className="text-sm text-muted-foreground">Growth Rate</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="revenue">
                <div className="text-center py-8 text-muted-foreground">
                  Revenue analytics charts would be displayed here
                </div>
              </TabsContent>
              <TabsContent value="users">
                <div className="text-center py-8 text-muted-foreground">
                  User analytics and demographics would be displayed here
                </div>
              </TabsContent>
              <TabsContent value="performance">
                <div className="text-center py-8 text-muted-foreground">
                  System performance metrics would be displayed here
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add Restaurant Modal */}
      <AddRestaurantModal
        open={addRestaurantOpen}
        onOpenChange={setAddRestaurantOpen}
        onRestaurantAdded={handleRestaurantAdded}
      />
    </AdminLayout>
  );
}