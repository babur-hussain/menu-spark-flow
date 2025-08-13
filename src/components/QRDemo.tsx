import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Smartphone, Scan, ArrowRight, CheckCircle, ShoppingCart, Plus } from "lucide-react";
import qrIcon from "@/assets/qr-icon.jpg";
import gourmetBurger from "@/assets/gourmet-burger.jpg";
import trufflePizza from "@/assets/truffle-pizza.jpg";
import caesarSalad from "@/assets/caesar-salad.jpg";
import { formatCurrency } from '@/lib/utils';

const QRDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [cart, setCart] = useState<{[key: string]: number}>({});

  const steps = [
    {
      title: "Generate QR Code",
      description: "Create unique QR codes for each table",
      icon: QrCode,
      status: "completed"
    },
    {
      title: "Customer Scans",
      description: "Instant access to digital menu",
      icon: Scan,
      status: currentStep >= 1 ? "completed" : "pending"
    },
    {
      title: "Browse Menu",
      description: "Stunning, appetite-stimulating interface",
      icon: Smartphone,
      status: currentStep >= 2 ? "completed" : "pending"
    },
    {
      title: "Place Order",
      description: "Real-time order to kitchen",
      icon: CheckCircle,
      status: currentStep >= 3 ? "completed" : "pending"
    }
  ];

  const menuItems = [
    {
      name: "Gourmet Burger",
      price: 18.99,
      description: "Juicy beef patty with artisanal cheese",
      rating: 4.8,
      image: gourmetBurger,
      id: "burger"
    },
    {
      name: "Truffle Pizza",
      price: 24.99,
      description: "Hand-tossed with black truffle oil",
      rating: 4.9,
      image: trufflePizza,
      id: "pizza"
    },
    {
      name: "Caesar Salad",
      price: 14.99,
      description: "Fresh romaine with house-made dressing",
      rating: 4.7,
      image: caesarSalad,
      id: "salad"
    }
  ];

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  return (
    <section id="qr" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            📱 QR Code Experience
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            See How It
            <span className="text-gradient block mt-2">Works in Action</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From QR code scan to order completion in just a few taps. 
            Experience the seamless customer journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Process Flow */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold mb-4">Simple 4-Step Process</h3>
              <p className="text-muted-foreground mb-8">
                Your customers go from hungry to satisfied in minutes
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer ${
                    step.status === "completed" 
                      ? "bg-success/10 border border-success/20" 
                      : "bg-muted/50 border border-border"
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className={`p-3 rounded-full ${
                    step.status === "completed" 
                      ? "bg-success text-success-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {step.status === "completed" && (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button 
                variant="gradient" 
                size="lg" 
                className="flex-1"
                onClick={() => setCurrentStep((prev) => (prev + 1) % 4)}
              >
                {currentStep < 3 ? "Next Step" : "Restart Demo"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {getTotalItems() > 0 && (
                <Button variant="fresh" size="lg" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Cart ({getTotalItems()})
                </Button>
              )}
            </div>
          </div>

          {/* Right: Demo Interface */}
          <div className="relative">
            {/* QR Code Card */}
            <Card className="qr-container mb-8">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Table 5 - Riverside Bistro
                </CardTitle>
                <CardDescription>Scan to view menu and order</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="inline-block p-4 bg-background rounded-xl shadow-inner">
                  <img src={qrIcon} alt="QR Code" className="w-32 h-32 mx-auto" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Point your camera at the QR code above
                </p>
              </CardContent>
            </Card>

            {/* Mock Menu Interface */}
            <Card className="food-item">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Riverside Bistro Menu</CardTitle>
                  <Badge variant="success">Table 5</Badge>
                </div>
                <CardDescription>Swipe to explore our delicious offerings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {menuItems.slice(0, currentStep + 1).map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 group"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <span className="font-bold text-primary">{formatCurrency(item.price)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm">{item.rating}</span>
                          </div>
                          <Button 
                            variant="food" 
                            size="sm"
                            onClick={() => addToCart(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QRDemo;