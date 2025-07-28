import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RestaurantSelector } from "@/components/admin/RestaurantSelector";
import { restaurantAnalyticsService } from "@/lib/restaurantAnalytics";
import { restaurantService, Restaurant } from "@/lib/restaurantService";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Star, 
  AlertCircle,
  Plus,
  Building2
} from "lucide-react";

interface RestaurantAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageRating: number;
  quickStats: {
    todayRevenue: number;
    todayOrders: number;
    monthlyGrowth: number;
    customerSatisfaction: number;
  };
  recentOrders: Array<{
    id: string;
    customerName: string;
    amount: number;
    status: string;
    date: string;
  }>;
  topItems: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantData, setRestaurantData] = useState<RestaurantAnalytics | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateRestaurant, setShowCreateRestaurant] = useState(false);
  const [isCreatingRestaurant, setIsCreatingRestaurant] = useState(false);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!user?.id) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }
      if (!selectedRestaurant) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching restaurant data for restaurant:', selectedRestaurant.id);
        const data = await restaurantAnalyticsService.getRestaurantData(selectedRestaurant.id);
        if (data) {
          setRestaurantData(data);
        } else {
          setError('No data found for this restaurant');
        }
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
        setError('Failed to load restaurant data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurantData();
  }, [user?.id, selectedRestaurant?.id]);

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setRestaurantData(null);
    setError(null);
  };

  const handleCreateRestaurant = () => {
    setShowCreateRestaurant(true);
  };

  const handleRestaurantCreated = async (formData: {
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  }) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingRestaurant(true);
      const newRestaurant = await restaurantService.createRestaurant(user.id, formData);
      setSelectedRestaurant(newRestaurant);
      setShowCreateRestaurant(false);
      setError(null);
      toast({
        title: "Success",
        description: "Restaurant created successfully!",
      });
    } catch (error) {
      console.error('Error creating restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to create restaurant",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRestaurant(false);
    }
  };

  if (!selectedRestaurant) {
    return (
      <AdminLayout userRole="restaurant_manager">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Restaurant Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}. Select a restaurant to manage.
            </p>
          </div>
          <RestaurantSelector
            onRestaurantSelect={handleRestaurantSelect}
            selectedRestaurant={selectedRestaurant}
          />
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout userRole="restaurant_manager" restaurantName={selectedRestaurant.name}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading restaurant data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout userRole="restaurant_manager" restaurantName={selectedRestaurant.name}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {selectedRestaurant.name} Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.email}. Here's your restaurant overview.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedRestaurant(null)}
              >
                Change Restaurant
              </Button>
              <LogoutButton />
            </div>
          </div>

          {/* Quick Overview for Empty Restaurant */}
          <Card className="border-primary bg-primary/5">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
              <img src="/public/placeholder.svg" alt="Welcome" className="w-24 h-24 mb-4 opacity-80" />
              <h2 className="text-2xl font-bold mb-2">Welcome to {selectedRestaurant.name}!</h2>
              <p className="text-muted-foreground mb-4 max-w-xl">
                Get started by adding your first menu item or creating a test order. Once you have some data, your dashboard will show analytics and insights for your restaurant.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="default"
                  onClick={() => window.location.href = '/admin/menu'}
                >
                  + Add Menu Item
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/admin/orders'}
                >
                  + Create Test Order
                </Button>
              </div>
              <div className="mt-8 text-xs text-muted-foreground">
                <span className="font-semibold">Tip:</span> You can always return here to see your restaurant's performance once you have some activity.
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userRole="restaurant_manager" restaurantName={selectedRestaurant.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedRestaurant.name} Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}. Here's your restaurant overview.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedRestaurant(null)}
            >
              Change Restaurant
            </Button>
            <LogoutButton />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${restaurantData?.totalRevenue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{restaurantData?.quickStats?.monthlyGrowth || 0}% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restaurantData?.totalOrders?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{restaurantData?.quickStats?.todayOrders || 0} today
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restaurantData?.totalCustomers?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{restaurantData?.quickStats?.customerSatisfaction || 0}% satisfaction
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restaurantData?.averageRating?.toFixed(1) || 0}</div>
              <p className="text-xs text-muted-foreground">
                Based on {restaurantData?.totalCustomers || 0} reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest orders from your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {restaurantData?.recentOrders?.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {order.customerName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                    <span className="text-sm font-medium">
                      ${order.amount}
                    </span>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  No recent orders found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
            <CardDescription>
              Your most popular menu items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {restaurantData?.topItems?.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {item.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.sales} orders
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    ${item.revenue}
                  </span>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  No menu items found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}