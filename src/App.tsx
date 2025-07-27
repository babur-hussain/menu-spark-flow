import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RestaurantRegistration from "./pages/RestaurantRegistration";
import MenuCreation from "./pages/MenuCreation";
import Order from "./pages/Order";
import AdminLogin from "./pages/admin/AdminLogin";
import RestaurantDashboard from "./pages/admin/RestaurantDashboard";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/restaurant-registration" element={<RestaurantRegistration />} />
          <Route path="/menu-creation" element={<MenuCreation />} />
          <Route path="/order/:restaurantId" element={<Order />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<RestaurantDashboard />} />
          <Route path="/admin/overview" element={<SuperAdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
