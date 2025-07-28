import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, Menu, X, ChefHat, Users, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileDropdown } from "@/components/auth/ProfileDropdown";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const navItems = [
    { name: "Features", href: "#features", icon: ChefHat },
    { name: "For Restaurants", href: "#restaurants", icon: Users },
    { name: "Analytics", href: "#analytics", icon: BarChart3 },
    { name: "QR Codes", href: "#qr", icon: QrCode },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-orange-200 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 mr-3 shadow-lg">
                <QrCode className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                MenuMaster
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-orange-600 transition-all duration-300 flex items-center gap-2 font-semibold hover:scale-105"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </a>
            ))}
            
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <>
                <Button 
                  variant="outline"
                  className="border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white font-semibold transition-all duration-300 hover:scale-105"
                  onClick={() => window.location.href = '/admin/login'}
                >
                  Admin Login
                </Button>
                <Button 
                  className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-bold shadow-xl transform hover:scale-105 transition-all duration-300"
                  size="lg"
                  onClick={() => window.location.href = '/restaurant-registration'}
                >
                  🚀 Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-orange-600 hover:bg-orange-50"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl mt-2 shadow-xl">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-100 transition-all duration-300 flex items-center gap-2 font-semibold rounded-lg"
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
              <div className="px-3 py-2 space-y-2">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <ProfileDropdown />
                  </div>
                ) : (
                  <>
                    <Button 
                      variant="outline"
                      className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white font-semibold"
                      onClick={() => window.location.href = '/admin/login'}
                    >
                      Admin Login
                    </Button>
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-bold shadow-lg"
                      onClick={() => window.location.href = '/restaurant-registration'}
                    >
                      🚀 Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;