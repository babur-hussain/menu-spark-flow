import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Smartphone, TrendingUp, Clock, UtensilsCrossed, ChefHat, Pizza, Burger } from "lucide-react";
import heroBurger from "@/assets/hero-burger.jpg";

const Hero = () => {
  const features = [
    { icon: QrCode, text: "Instant QR Menus", color: "from-orange-500 to-red-500" },
    { icon: Smartphone, text: "Mobile Optimized", color: "from-blue-500 to-purple-500" },
    { icon: TrendingUp, text: "Boost Sales", color: "from-green-500 to-emerald-500" },
    { icon: Clock, text: "Real-time Orders", color: "from-pink-500 to-rose-500" },
  ];

  const floatingFoods = [
    { emoji: "🍕", delay: "0s", position: "top-20 left-10" },
    { emoji: "🍔", delay: "1s", position: "top-40 right-20" },
    { emoji: "🍣", delay: "2s", position: "bottom-40 left-20" },
    { emoji: "🍜", delay: "3s", position: "bottom-20 right-10" },
    { emoji: "🥗", delay: "0.5s", position: "top-60 left-1/3" },
    { emoji: "🍰", delay: "1.5s", position: "bottom-60 right-1/3" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(15_100%_55%_0.1),transparent_50%)] animate-pulse dark:bg-[radial-gradient(circle_at_50%_50%,hsl(217_91%_60%_0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(348_100%_62%_0.1),transparent_50%)] animate-pulse dark:bg-[radial-gradient(circle_at_20%_80%,hsl(280_65%_60%_0.1),transparent_50%)]" style={{ animationDelay: "1s" }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(25_100%_58%_0.1),transparent_50%)] animate-pulse dark:bg-[radial-gradient(circle_at_80%_20%,hsl(160_60%_45%_0.1),transparent_50%)]" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Floating Food Emojis */}
      {floatingFoods.map((food, index) => (
        <div
          key={index}
          className={`absolute ${food.position} text-4xl animate-float opacity-20 dark:opacity-10`}
          style={{ animationDelay: food.delay }}
        >
          {food.emoji}
        </div>
      ))}

      {/* Background Image with Enhanced Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBurger}
          alt="Delicious food"
          className="w-full h-full object-cover opacity-20 dark:opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-yellow-500/20 dark:from-gray-900/40 dark:via-gray-800/40 dark:to-gray-900/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Animated Badge */}
          <div className="flex justify-center mb-8">
            <Badge 
              className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 dark:from-orange-600 dark:via-red-600 dark:to-pink-600 text-white border-0 shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              🍽️ Revolutionary Restaurant Technology 🍽️
            </Badge>
          </div>

          {/* Main Heading with Enhanced Animations */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 dark:from-orange-400 dark:via-red-400 dark:to-pink-400 bg-clip-text text-transparent">
              Transform Your
            </span>
            <span className="block mt-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 dark:from-yellow-400 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent">
              Restaurant Experience
            </span>
          </h1>

          {/* Enhanced Subtitle */}
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
            Complete QR-based menu system with real-time ordering, kitchen management, 
            and analytics to maximize customer engagement and streamline operations.
          </p>

          {/* Enhanced Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-float border border-orange-200/20 dark:border-orange-500/20"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <feature.icon className="h-10 w-10 text-orange-600 dark:text-orange-400 mb-3 mx-auto group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200 text-center block">{feature.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-16">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 dark:from-orange-600 dark:via-red-600 dark:to-pink-600 dark:hover:from-orange-700 dark:hover:via-red-700 dark:hover:to-pink-700 text-white font-bold text-lg px-8 py-4 rounded-full shadow-2xl hover:shadow-orange-500/25 dark:hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300 border-0"
              onClick={() => window.location.href = '/restaurant-registration'}
            >
              🚀 Get Started Now
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-600 dark:hover:text-white font-bold text-lg px-8 py-4 rounded-full shadow-xl hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300"
              onClick={() => window.location.href = '/admin/login'}
            >
              👨‍💼 Admin Login
            </Button>
          </div>

          {/* Social Proof */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              Trusted by <span className="font-bold text-orange-600 dark:text-orange-400">500+</span> restaurants worldwide
            </p>
            <div className="flex justify-center items-center gap-1">
              <span className="text-yellow-500 animate-pulse">⭐</span>
              <span className="text-yellow-500 animate-pulse">⭐</span>
              <span className="text-yellow-500 animate-pulse">⭐</span>
              <span className="text-yellow-500 animate-pulse">⭐</span>
              <span className="text-yellow-500 animate-pulse">⭐</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements (Blurry Orbs) */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-3/4 left-1/3 w-24 h-24 bg-gradient-to-r from-pink-400 to-red-400 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>
    </section>
  );
};

export default Hero;