import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here's what's happening at {restaurantData.name} today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <QrCode className="w-4 h-4 mr-2" />
              Generate QR
            </Button>
            <Button>View Reports</Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {restaurantData.quickStats.map((stat, index) => (
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
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}