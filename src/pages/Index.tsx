import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import RestaurantShowcase from "@/components/RestaurantShowcase";
import QRDemo from "@/components/QRDemo";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Features />
      <RestaurantShowcase />
      <QRDemo />
      <Dashboard />
      <Footer />
    </div>
  );
};

export default Index;
