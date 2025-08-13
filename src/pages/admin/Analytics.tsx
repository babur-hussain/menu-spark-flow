import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock, 
  Star,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { useAuth } from "@/contexts/AuthContext";
import { restaurantAnalyticsService } from "@/lib/restaurantAnalytics";
import { formatCurrency } from '@/lib/utils';
import { simpleSetupDatabase } from "@/lib/simpleSetup";
import { useToast } from "@/components/ui/use-toast";

interface AnalyticsData {
  revenue: { month: string; value: number }[];
  orders: { month: string; value: number }[];
  customers: { month: string; value: number }[];
  ratings: { month: string; value: number }[];
}

export default function Analytics() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    revenue: [],
    orders: [],
    customers: [],
    ratings: [],
  });
  const [restaurantStats, setRestaurantStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalCustomers: 0,
  });
  const [topMenuItems, setTopMenuItems] = useState([]);
  const [customerSegments, setCustomerSegments] = useState([]);
  const [orderTypes, setOrderTypes] = useState([]);
  const { toast } = useToast();

  // Fetch analytics data on component mount
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user?.restaurant_id) return;
      
      try {
        setIsLoading(true);
        const restaurantData = await restaurantAnalyticsService.getRestaurantData(user.restaurant_id);
        
        if (restaurantData) {
          setRestaurantStats({
            totalOrders: restaurantData.stats.totalOrders,
            totalRevenue: restaurantData.stats.totalRevenue,
            averageRating: restaurantData.stats.rating,
            totalCustomers: restaurantData.stats.totalCustomers || 0,
          });

          // Convert analytics data to chart format
          const revenueData = restaurantData.monthlyStats.map(item => ({
            month: item.month,
            value: item.revenue,
          }));
          const ordersData = restaurantData.monthlyStats.map(item => ({
            month: item.month,
            value: item.orders,
          }));

          setAnalyticsData({
            revenue: revenueData,
            orders: ordersData,
            customers: [], // Will be populated when customer analytics is available
            ratings: [], // Will be populated when rating analytics is available
          });
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user?.restaurant_id]);

  const getCurrentData = () => {
    switch (selectedMetric) {
      case "revenue":
        return analyticsData.revenue;
      case "orders":
        return analyticsData.orders;
      case "customers":
        return analyticsData.customers;
      case "ratings":
        return analyticsData.ratings;
      default:
        return analyticsData.revenue;
    }
  };

  const getMetricInfo = () => {
    switch (selectedMetric) {
      case "revenue":
        return {
          title: "Revenue",
          description: "Total revenue over time",
          icon: DollarSign,
          color: "#10b981",
          formatValue: (value: number) => formatCurrency(value),
        };
      case "orders":
        return {
          title: "Orders",
          description: "Number of orders over time",
          icon: Activity,
          color: "#3b82f6",
          formatValue: (value: number) => value.toString(),
        };
      case "customers":
        return {
          title: "Customers",
          description: "Number of unique customers",
          icon: Users,
          color: "#8b5cf6",
          formatValue: (value: number) => value.toString(),
        };
      case "ratings":
        return {
          title: "Ratings",
          description: "Average customer ratings",
          icon: Star,
          color: "#f59e0b",
          formatValue: (value: number) => value.toFixed(1),
        };
      default:
        return {
          title: "Revenue",
          description: "Total revenue over time",
          icon: DollarSign,
          color: "#10b981",
          formatValue: (value: number) => formatCurrency(value),
        };
    }
  };

  const metricInfo = getMetricInfo();

  return (
    <AdminLayout userRole="restaurant_manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Track your restaurant's performance and key metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <LogoutButton variant="outline" />
          </div>
        </div>

        {/* Database Setup Alert */}
        {!user?.restaurant_id && (
          <div className="mb-6">
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

        {/* Quick Stats */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(restaurantStats.totalRevenue)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  All time revenue
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restaurantStats.totalOrders}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  All time orders
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {restaurantStats.totalOrders > 0 ? formatCurrency(restaurantStats.totalRevenue / restaurantStats.totalOrders) : '0.00'}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  Average per order
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restaurantStats.averageRating.toFixed(1)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  Customer satisfaction
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="ratings">Ratings</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Analytics */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Main Chart */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{metricInfo.title} Analytics</CardTitle>
              <CardDescription>{metricInfo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsChart
                title={`${metricInfo.title} Trend`}
                description={`${metricInfo.title} over the last 6 months`}
                data={getCurrentData()}
                valueKey="value"
                color={metricInfo.color}
                formatValue={metricInfo.formatValue}
              />
            </CardContent>
          </Card>

          {/* Top Menu Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Menu Items</CardTitle>
              <CardDescription>Best performing dishes this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topMenuItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <h4 className="font-medium">{item.name}</h4>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{item.orders} orders</span>
                        <span>{formatCurrency(item.revenue)}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{item.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Segments */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
              <CardDescription>Breakdown of customer types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerSegments.map((segment, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{segment.segment}</span>
                      <span className="text-sm text-muted-foreground">{segment.count} customers</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${segment.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {segment.percentage}% of total customers
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Types */}
          <Card>
            <CardHeader>
              <CardTitle>Order Types</CardTitle>
              <CardDescription>Distribution of order methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderTypes.map((type, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type.type}</span>
                      <span className="text-sm text-muted-foreground">{type.count} orders</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {type.percentage}% of total orders
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key operational indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Avg Order Time</span>
                  </div>
                  <span className="text-lg font-bold">18 min</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Customer Retention</span>
                  </div>
                  <span className="text-lg font-bold">78%</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Satisfaction Score</span>
                  </div>
                  <span className="text-lg font-bold">4.7/5</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Profit Margin</span>
                  </div>
                  <span className="text-lg font-bold">32%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analytics</CardTitle>
            <CardDescription>Dive deeper into your restaurant's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="revenue" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="ratings">Ratings</TabsTrigger>
              </TabsList>
              <TabsContent value="revenue" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(89600)}</div>
                      <p className="text-xs text-muted-foreground">
                        +12.5% from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Daily Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(2987)}</div>
                      <p className="text-xs text-muted-foreground">
                        Per day this month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Peak Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">Saturday</div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(4200)} average
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="orders" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">3,570</div>
                      <p className="text-xs text-muted-foreground">
                        +8.2% from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Avg Daily Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">119</div>
                      <p className="text-xs text-muted-foreground">
                        Orders per day
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Busiest Hour</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">7-8 PM</div>
                      <p className="text-xs text-muted-foreground">
                        45 orders average
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="customers" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">2,640</div>
                      <p className="text-xs text-muted-foreground">
                        +15.3% from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">New Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">445</div>
                      <p className="text-xs text-muted-foreground">
                        This month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Repeat Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">78%</div>
                      <p className="text-xs text-muted-foreground">
                        Customer retention
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="ratings" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Average Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">4.7/5</div>
                      <p className="text-xs text-muted-foreground">
                        +0.2 from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">1,240</div>
                      <p className="text-xs text-muted-foreground">
                        This month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">5-Star Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">68%</div>
                      <p className="text-xs text-muted-foreground">
                        Of total reviews
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 