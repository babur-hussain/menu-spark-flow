import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { AddRestaurantModal } from "@/components/admin/AddRestaurantModal";
import { analyticsService, SystemAnalytics, Restaurant } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { populateSampleData } from "@/lib/sampleData";
import { setupDatabase } from "@/lib/setupDatabase";
import { simpleSetupDatabase } from "@/lib/simpleSetup";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  QrCode,
  BarChart3,
} from "lucide-react";
import { formatCurrency } from '@/lib/utils';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<SystemAnalytics | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch analytics data
        const analytics = await analyticsService.getAllAnalyticsData();
        setAnalyticsData(analytics);
        
        // Fetch restaurants
        const restaurantsData = await analyticsService.getRestaurants();
        setRestaurants(restaurantsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePopulateSampleData = async () => {
    try {
      await populateSampleData();
      // Refresh data after populating
      window.location.reload();
    } catch (error) {
      console.error('Error populating sample data:', error);
    }
  };

  // Auto-setup database when component mounts
  useEffect(() => {
    const autoSetupDatabase = async () => {
      try {
        console.log("Auto-setting up database...");
        await simpleSetupDatabase();
        console.log("Database auto-setup completed");
      } catch (error) {
        console.error('Error in auto database setup:', error);
      }
    };

    // Run auto-setup after a short delay
    const timer = setTimeout(autoSetupDatabase, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (error || !analyticsData) {
    return (
      <AdminLayout userRole="super_admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-destructive">{error || 'No analytics data available'}</p>
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
      title: "Total Restaurants",
      value: analyticsData.totalRestaurants || 0,
      change: analyticsData.restaurantGrowth || 0,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Users",
      value: analyticsData.totalUsers || 0,
      change: analyticsData.userGrowth || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(analyticsData.totalRevenue || 0),
      change: analyticsData.revenueGrowth || 0,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Growth Rate",
      value: `${(analyticsData.growthRate || 0).toFixed(1)}%`,
      change: analyticsData.growthRateChange || 0,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <AdminLayout userRole="super_admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}. Here's the system overview.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handlePopulateSampleData}
            >
              Populate Sample Data
            </Button>
            <LogoutButton />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change >= 0 ? "text-green-600" : "text-red-600"}>
                    {stat.change >= 0 ? "+" : ""}{stat.change}%
                  </span>{" "}
                  from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Analytics */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>System Revenue</CardTitle>
              <CardDescription>
                Total revenue across all restaurants over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsChart
                data={analyticsData.revenueData || []}
                title="Revenue"
                color="rgb(34, 197, 94)"
                formatValue={(value) => `$${value}`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Orders</CardTitle>
              <CardDescription>
                Total orders across all restaurants over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsChart
                data={analyticsData.orderData || []}
                title="Orders"
                color="rgb(59, 130, 246)"
                formatValue={(value) => value.toString()}
              />
            </CardContent>
          </Card>
        </div>

        {/* Restaurant Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Restaurant Management</CardTitle>
                <CardDescription>
                  Manage all registered restaurants and their performance
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Restaurant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search restaurants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Restaurants List */}
              <div className="space-y-4">
                {filteredRestaurants.length > 0 ? (
                  filteredRestaurants.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{restaurant.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {restaurant.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {restaurant.phone || 'No phone'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {restaurant.address || 'No address'}
                          </p>
                        </div>
                        <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                          {restaurant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTerm ? "No restaurants found matching your search." : "No restaurants registered yet."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Analytics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Platform Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Restaurants</span>
                <span className="font-medium">
                  {analyticsData.activeRestaurants || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Orders</span>
                <span className="font-medium">
                  {analyticsData.totalOrders || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg. Order Value</span>
                <span className="font-medium">
                  ${(analyticsData.averageOrderValue || 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Customers</span>
                <span className="font-medium">
                  {analyticsData.totalCustomers || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">New This Month</span>
                <span className="font-medium">
                  {analyticsData.newCustomers || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="font-medium">
                  {analyticsData.activeUsers || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Quality Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg. Rating</span>
                <span className="font-medium">
                  {(analyticsData.averageRating || 0).toFixed(1)}/5
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="font-medium">
                  {analyticsData.avgResponseTime || 0} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Satisfaction</span>
                <span className="font-medium">
                  {(analyticsData.customerSatisfaction || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Restaurant Modal */}
      <AddRestaurantModal
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </AdminLayout>
  );
}