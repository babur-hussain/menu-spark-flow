import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  Users, 
  ChefHat, 
  BarChart3, 
  Smartphone, 
  CreditCard,
  Gift,
  Clock,
  Shield,
  Zap
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: QrCode,
      title: "Smart QR Code Generation",
      description: "Auto-generate unique QR codes per table for instant menu access and seamless ordering experience.",
      badge: "Core Feature",
      color: "text-primary"
    },
    {
      icon: Users,
      title: "Multi-Restaurant Management",
      description: "Manage multiple restaurants with unique menus, staff roles, and customized themes from one dashboard.",
      badge: "Enterprise",
      color: "text-accent"
    },
    {
      icon: ChefHat,
      title: "Kitchen Display System",
      description: "Real-time order tracking for kitchen staff with preparation times and priority management.",
      badge: "Pro Feature",
      color: "text-success"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track most ordered dishes, peak hours, average bills, and customer preferences with detailed insights.",
      badge: "Analytics",
      color: "text-warning"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Stunning, responsive interface optimized for mobile ordering with smooth animations and intuitive UX.",
      badge: "Design",
      color: "text-primary"
    },
    {
      icon: CreditCard,
      title: "Smart Billing System",
      description: "Seamless payment processing with GST invoices, bill splitting, and digital receipt management.",
      badge: "Payments",
      color: "text-accent"
    },
    {
      icon: Gift,
      title: "Dynamic Offers & Coupons",
      description: "Create flash deals, combo offers, loyalty points, and automated promotional campaigns.",
      badge: "Marketing",
      color: "text-success"
    },
    {
      icon: Clock,
      title: "Real-Time Order Management",
      description: "Live order tracking, add/remove items, and instant communication between staff and kitchen.",
      badge: "Operations",
      color: "text-warning"
    },
    {
      icon: Shield,
      title: "Role-Based Access Control",
      description: "Assign managers, staff, chefs, and delivery personnel with customized permissions per restaurant.",
      badge: "Security",
      color: "text-destructive"
    },
    {
      icon: Zap,
      title: "Offline Mode Support",
      description: "Continue taking orders even with poor internet connectivity, syncing when connection is restored.",
      badge: "Reliability",
      color: "text-primary"
    }
  ];

  const getBadgeVariant = (badge: string) => {
    switch (badge) {
      case "Core Feature": return "default";
      case "Enterprise": return "secondary";
      case "Pro Feature": return "outline";
      default: return "secondary";
    }
  };

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            ✨ Complete Restaurant Solution
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="text-gradient block mt-2">Revolutionize Your Restaurant</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From QR code generation to kitchen management, our comprehensive platform 
            handles every aspect of modern restaurant operations.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="food-item group border-border/50 hover:border-primary/30 relative overflow-hidden"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-background shadow-sm ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <Badge variant={getBadgeVariant(feature.badge)} className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors duration-200">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-6">
            Ready to transform your restaurant operations?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-hero">
              Start Free Trial
            </button>
            <button className="px-8 py-4 rounded-xl border border-border hover:border-primary/50 transition-colors duration-200">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;