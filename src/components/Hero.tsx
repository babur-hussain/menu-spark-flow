import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Smartphone, TrendingUp, Clock } from "lucide-react";
import heroBurger from "@/assets/hero-burger.jpg";

const Hero = () => {
  const features = [
    { icon: QrCode, text: "Instant QR Menus" },
    { icon: Smartphone, text: "Mobile Optimized" },
    { icon: TrendingUp, text: "Boost Sales" },
    { icon: Clock, text: "Real-time Orders" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBurger}
          alt="Delicious food"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="px-6 py-3 text-lg animate-pulse-warm shadow-lg border-2 border-primary/30">
              ✨ Revolutionary Restaurant Technology ✨
            </Badge>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            Transform Your
            <span className="text-gradient block mt-2 animate-pulse">Restaurant Experience</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Complete QR-based menu system with real-time ordering, kitchen management, 
            and analytics to maximize customer engagement and streamline operations.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-2xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-4 card-warm animate-float"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <feature.icon className="h-8 w-8 text-primary mb-2" />
                <span className="text-sm font-medium text-center">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              variant="hero" 
              size="xl" 
              className="animate-pulse-warm shadow-2xl"
              onClick={() => window.location.href = '/restaurant-registration'}
            >
              🚀 Start Free Trial
            </Button>
            <Button 
              variant="electric" 
              size="xl" 
              className="shadow-xl"
              onClick={() => document.querySelector('#qr')?.scrollIntoView({ behavior: 'smooth' })}
            >
              ▶️ Watch Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Trusted by 1000+ restaurants worldwide</p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold">★★★★★</div>
              <div className="text-sm">4.9/5 rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float">
        <div className="w-16 h-16 bg-primary/20 rounded-full blur-xl"></div>
      </div>
      <div className="absolute bottom-20 right-10 animate-float" style={{ animationDelay: "1s" }}>
        <div className="w-24 h-24 bg-accent/20 rounded-full blur-xl"></div>
      </div>
    </section>
  );
};

export default Hero;