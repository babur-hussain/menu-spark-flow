import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

export default function SuperAdminDashboard() {
  const systemData = {
    totalRestaurants: 156,
    totalUsers: 3420,
    totalRevenue: 890750,
    growthRate: 12.5,
    restaurants: [
      {
        id: 1,
        name: "Bella Vista Restaurant",
        owner: "John Smith",
        location: "New York, NY",
        status: "active",
        rating: 4.8,
        monthlyRevenue: 45750,
        orders: 1247,
        joinDate: "2024-01-15",
      },
      {
        id: 2,
        name: "Golden Dragon",
        owner: "Li Wei",
        location: "San Francisco, CA",
        status: "active",
        rating: 4.6,
        monthlyRevenue: 38920,
        orders: 892,
        joinDate: "2024-02-03",
      },
      {
        id: 3,
        name: "Ocean Breeze Cafe",
        owner: "Maria Garcia",
        location: "Miami, FL",
        status: "pending",
        rating: 4.4,
        monthlyRevenue: 28340,
        orders: 634,
        joinDate: "2024-03-10",
      },
      {
        id: 4,
        name: "Mountain View Bistro",
        owner: "David Johnson",
        location: "Denver, CO",
        status: "suspended",
        rating: 3.9,
        monthlyRevenue: 19850,
        orders: 423,
        joinDate: "2024-01-28",
      },
    ],
    recentActivities: [
      { type: "new_restaurant", message: "Ocean Breeze Cafe submitted registration", time: "2 hours ago" },
      { type: "payment", message: "Bella Vista Restaurant paid monthly subscription", time: "5 hours ago" },
      { type: "issue", message: "Golden Dragon reported technical issue", time: "1 day ago" },
      { type: "milestone", message: "Mountain View Bistro reached 1000 orders", time: "2 days ago" },
    ],
  };

  const quickStats = [
    { label: "Total Restaurants", value: systemData.totalRestaurants, change: "+8", icon: Building, color: "text-blue-500" },
    { label: "Total Users", value: systemData.totalUsers, change: "+124", icon: Users, color: "text-green-500" },
    { label: "Total Revenue", value: `$${systemData.totalRevenue.toLocaleString()}`, change: "+12.5%", icon: DollarSign, color: "text-purple-500" },
    { label: "Growth Rate", value: `${systemData.growthRate}%`, change: "+2.1%", icon: TrendingUp, color: "text-orange-500" },
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
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Restaurant
            </Button>
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
                    <Input placeholder="Search restaurants..." className="pl-8 w-64" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemData.restaurants.map((restaurant) => (
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
                ))}
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
              {systemData.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === "new_restaurant" ? "bg-blue-500" :
                    activity.type === "payment" ? "bg-green-500" :
                    activity.type === "issue" ? "bg-red-500" : "bg-purple-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
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
                    <div className="text-2xl font-bold text-blue-500">156</div>
                    <p className="text-sm text-muted-foreground">Total Restaurants</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">3,420</div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-500">$890K</div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">98.5%</div>
                    <p className="text-sm text-muted-foreground">System Uptime</p>
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
    </AdminLayout>
  );
}