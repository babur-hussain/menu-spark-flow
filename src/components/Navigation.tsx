import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, Menu, X, ChefHat, Users, BarChart3 } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Features", href: "#features", icon: ChefHat },
    { name: "For Restaurants", href: "#restaurants", icon: Users },
    { name: "Analytics", href: "#analytics", icon: BarChart3 },
    { name: "QR Codes", href: "#qr", icon: QrCode },
  ];

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <QrCode className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-bold text-gradient">MenuMaster</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </a>
            ))}
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => alert('Welcome! Starting your restaurant transformation journey...')}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card rounded-lg mt-2 border border-border">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </a>
              ))}
              <div className="px-3 py-2">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false);
                    alert('Welcome! Starting your restaurant transformation journey...');
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;