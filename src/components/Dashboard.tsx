import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  ChefHat,
  Smartphone,
  Star,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import dashboardPreview from "@/assets/dashboard-preview.jpg";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Revenue",
      value: "$12,847",
      change: "+12.5%",
      changeType: "increase",
      icon: DollarSign,
      color: "text-success"
    },
    {
      title: "Orders Today",
      value: "156",
      change: "+8.2%",
      changeType: "increase",
      icon: Smartphone,
      color: "text-primary"
    },
    {
      title: "Active Tables",
      value: "23/32",
      change: "72%",
      changeType: "neutral",
      icon: Users,
      color: "text-accent"
    },
    {
      title: "Avg. Order Value",
      value: "$82.43",
      change: "-2.1%",
      changeType: "decrease",
      icon: BarChart3,
      color: "text-warning"
    }
  ];

  const topDishes = [
    { name: "Gourmet Burger", orders: 24, revenue: "$431.76", trend: "up" },
    { name: "Truffle Pizza", orders: 18, revenue: "$449.82", trend: "up" },
    { name: "Caesar Salad", orders: 15, revenue: "$224.85", trend: "down" },
    { name: "Salmon Teriyaki", orders: 12, revenue: "$359.88", trend: "up" }
  ];

  const recentOrders = [
    { table: "Table 7", items: "2x Burger, 1x Fries", time: "2 min ago", status: "preparing" },
    { table: "Table 12", items: "1x Pizza, 2x Drinks", time: "5 min ago", status: "ready" },
    { table: "Table 3", items: "3x Salad, 1x Soup", time: "8 min ago", status: "served" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing": return "bg-warning/20 text-warning-foreground border-warning/30";
      case "ready": return "bg-success/20 text-success-foreground border-success/30";
      case "served": return "bg-muted/20 text-muted-foreground border-border";
      default: return "bg-muted/20 text-muted-foreground border-border";
    }
  };

  return (
    <section id="analytics" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            📊 Analytics Dashboard
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Make Data-Driven
            <span className="text-gradient block mt-2">Restaurant Decisions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get real-time insights into your restaurant performance with comprehensive 
            analytics and actionable intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column: Stats and Charts */}
          <div className="xl:col-span-2 space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="food-item">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg bg-background ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${
                        stat.changeType === "increase" ? "text-success" :
                        stat.changeType === "decrease" ? "text-destructive" :
                        "text-muted-foreground"
                      }`}>
                        {stat.changeType === "increase" && <ArrowUp className="h-3 w-3" />}
                        {stat.changeType === "decrease" && <ArrowDown className="h-3 w-3" />}
                        {stat.change}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold mb-1">{stat.value}</div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Dashboard Preview */}
            <Card className="food-item overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Restaurant Performance Overview
                </CardTitle>
                <CardDescription>
                  Live dashboard showing real-time restaurant metrics and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative">
                  <img 
                    src={dashboardPreview} 
                    alt="Dashboard Preview" 
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-foreground/80">
                        Updated 2 minutes ago
                      </div>
                      <Button variant="outline" size="sm">
                        View Full Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Top Dishes and Recent Orders */}
          <div className="space-y-8">
            {/* Top Dishes */}
            <Card className="food-item">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-warning" />
                  Top Performing Dishes
                </CardTitle>
                <CardDescription>Most ordered items today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topDishes.map((dish, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{dish.name}</span>
                        {dish.trend === "up" ? 
                          <TrendingUp className="h-3 w-3 text-success" /> :
                          <ArrowDown className="h-3 w-3 text-destructive" />
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {dish.orders} orders • {dish.revenue}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="food-item">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  Live Order Feed
                </CardTitle>
                <CardDescription>Real-time order status updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <div className="font-medium mb-1">{order.table}</div>
                      <div className="text-sm text-muted-foreground mb-2">{order.items}</div>
                      <div className="text-xs text-muted-foreground">{order.time}</div>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Kitchen Status */}
            <Card className="food-item">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-primary" />
                  Kitchen Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Orders in Queue</span>
                    <Badge variant="warning">8</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Prep Time</span>
                    <span className="text-sm font-medium">12 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Kitchen Load</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="w-3/4 h-full bg-warning rounded-full"></div>
                      </div>
                      <span className="text-xs text-muted-foreground">75%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-6">
            Ready to get insights that drive growth?
          </p>
          <Button variant="hero" size="xl">
            Start Your Analytics Journey
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;