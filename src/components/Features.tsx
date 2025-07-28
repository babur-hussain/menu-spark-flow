import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50"
    },
    {
      icon: Users,
      title: "Multi-Restaurant Management",
      description: "Manage multiple restaurants with unique menus, staff roles, and customized themes from one dashboard.",
      badge: "Enterprise",
      gradient: "from-blue-500 to-purple-500",
      bgGradient: "from-blue-50 to-purple-50"
    },
    {
      icon: ChefHat,
      title: "Kitchen Display System",
      description: "Real-time order tracking for kitchen staff with preparation times and priority management.",
      badge: "Pro Feature",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track most ordered dishes, peak hours, average bills, and customer preferences with detailed insights.",
      badge: "Analytics",
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-50 to-orange-50"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Stunning, responsive interface optimized for mobile ordering with smooth animations and intuitive UX.",
      badge: "Design",
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-50 to-rose-50"
    },
    {
      icon: CreditCard,
      title: "Smart Billing System",
      description: "Seamless payment processing with GST invoices, bill splitting, and digital receipt management.",
      badge: "Payments",
      gradient: "from-indigo-500 to-blue-500",
      bgGradient: "from-indigo-50 to-blue-50"
    },
    {
      icon: Gift,
      title: "Dynamic Offers & Coupons",
      description: "Create flash deals, combo offers, loyalty points, and automated promotional campaigns.",
      badge: "Marketing",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      icon: Clock,
      title: "Real-Time Order Management",
      description: "Live order tracking, add/remove items, and instant communication between staff and kitchen.",
      badge: "Operations",
      gradient: "from-teal-500 to-cyan-500",
      bgGradient: "from-teal-50 to-cyan-50"
    },
    {
      icon: Shield,
      title: "Role-Based Access Control",
      description: "Assign managers, staff, chefs, and delivery personnel with customized permissions per restaurant.",
      badge: "Security",
      gradient: "from-red-500 to-pink-500",
      bgGradient: "from-red-50 to-pink-50"
    },
    {
      icon: Zap,
      title: "Offline Mode Support",
      description: "Continue taking orders even with poor internet connectivity, syncing when connection is restored.",
      badge: "Reliability",
      gradient: "from-amber-500 to-yellow-500",
      bgGradient: "from-amber-50 to-yellow-50"
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
    <section className="py-20 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-6 px-6 py-3 text-lg font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 dark:from-orange-600 dark:via-red-600 dark:to-pink-600 text-white border-0 shadow-xl">
            ✨ Powerful Features
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 dark:from-orange-400 dark:via-red-400 dark:to-pink-400 bg-clip-text text-transparent">
            Everything You Need to
          </h2>
          <h2 className="text-4xl md:text-6xl font-black mb-8 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 dark:from-yellow-400 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent">
            Succeed
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            From QR code generation to real-time analytics, we provide all the tools 
            you need to transform your restaurant operations and boost customer satisfaction.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`group relative overflow-hidden bg-gradient-to-br ${feature.bgGradient} border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 animate-float dark:shadow-gray-900/50`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent dark:from-gray-800/20 rounded-lg"></div>
              <CardContent className="p-8 relative z-10">
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300 mb-6`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 dark:from-orange-600 dark:via-red-600 dark:to-pink-600 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Restaurant?
            </h3>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of restaurants already using our platform to increase 
              efficiency and customer satisfaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-orange-400 dark:hover:bg-gray-700 font-bold text-lg px-8 py-4 rounded-full shadow-xl transform hover:scale-105 transition-all duration-300"
                onClick={() => window.location.href = '/restaurant-registration'}
              >
                🚀 Start Free Trial
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-orange-600 dark:border-gray-300 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-orange-400 font-bold text-lg px-8 py-4 rounded-full shadow-xl transform hover:scale-105 transition-all duration-300"
                onClick={() => window.location.href = '/admin/login'}
              >
                📊 View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;