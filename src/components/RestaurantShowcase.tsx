import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  Utensils,
  TrendingUp,
  Phone,
  Globe
} from "lucide-react";
import restaurantInterior from "@/assets/restaurant-interior.jpg";
import kitchenStaff from "@/assets/kitchen-staff.jpg";
import salmonDish from "@/assets/salmon-dish.jpg";

const RestaurantShowcase = () => {
  const restaurants = [
    {
      name: "Riverside Bistro",
      cuisine: "Modern European",
      rating: 4.8,
      reviews: 324,
      location: "Downtown District",
      image: restaurantInterior,
      features: ["QR Ordering", "Live Kitchen", "Analytics"],
      growth: "+45% orders"
    },
    {
      name: "Spice Garden",
      cuisine: "Asian Fusion",
      rating: 4.9,
      reviews: 567,
      location: "Arts Quarter",
      image: kitchenStaff,
      features: ["Multi-language", "Delivery", "Loyalty Program"],
      growth: "+67% revenue"
    },
    {
      name: "Ocean Pearl",
      cuisine: "Fresh Seafood",
      rating: 4.7,
      reviews: 234,
      location: "Harbor View",
      image: salmonDish,
      features: ["Seasonal Menu", "Wine Pairing", "Private Dining"],
      growth: "+23% customers"
    }
  ];

  const stats = [
    { icon: Users, value: "1,200+", label: "Active Restaurants" },
    { icon: TrendingUp, value: "3.5M+", label: "Orders Processed" },
    { icon: Star, value: "4.9", label: "Average Rating" },
    { icon: Globe, value: "25+", label: "Countries" }
  ];

  return (
    <section id="restaurants" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            🏆 Success Stories
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Restaurants Thriving with
            <span className="text-gradient block mt-2">MenuMaster Technology</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of restaurants worldwide that have transformed their operations 
            and boosted revenue with our comprehensive QR menu system.
          </p>
        </div>

        {/* Success Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="food-item text-center">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Restaurant Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {restaurants.map((restaurant, index) => (
            <Card key={index} className="food-item overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <Badge variant="success" className="bg-success/90">
                    {restaurant.growth}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-1">{restaurant.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mb-2">
                      <Utensils className="h-4 w-4" />
                      {restaurant.cuisine}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-semibold">{restaurant.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{restaurant.reviews} reviews</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  {restaurant.location}
                </div>

                <div className="flex flex-wrap gap-2">
                  {restaurant.features.map((feature, featureIndex) => (
                    <Badge key={featureIndex} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex gap-2">
                  <Button variant="food" size="sm" className="flex-1">
                    <Phone className="h-3 w-3 mr-1" />
                    Contact
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Visit Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="food-item max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Join Them?</h3>
              <p className="text-muted-foreground mb-6">
                Start your transformation today and see results within the first week.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="hero" 
                  size="lg"
                  onClick={() => alert('🎉 Starting your restaurant setup process...')}
                >
                  Start Your Success Story
                </Button>
                <Button 
                  variant="fresh" 
                  size="lg"
                  onClick={() => document.querySelector('#analytics')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  See More Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RestaurantShowcase;