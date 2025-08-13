import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute, RestaurantManagerRoute, SuperAdminRoute } from "@/components/auth/ProtectedRoute";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import SetupRequired from "@/components/SetupRequired";
import Index from "./pages/Index";
import RestaurantRegistration from "./pages/RestaurantRegistration";
import MenuCreation from "./pages/MenuCreation";
import Order from "./pages/Order";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import AdminProfile from "./pages/admin/AdminProfile";
import RestaurantDashboardWrapper from "./pages/admin/RestaurantDashboardWrapper";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import MenuManagement from "./pages/admin/MenuManagement";
import QRCodeManagement from "./pages/admin/QRCodeManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import OrderHistory from "./pages/admin/OrderHistory";
import StaffManagement from "./pages/admin/StaffManagement";
import Analytics from "./pages/admin/Analytics";
import Reviews from "./pages/admin/Reviews";
import Settings from "./pages/admin/Settings";
import Restaurants from "./pages/admin/Restaurants";
import UserManagement from "./pages/admin/UserManagement";
import GlobalAnalytics from "./pages/admin/GlobalAnalytics";
import SystemSettings from "./pages/admin/SystemSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // If Supabase is not configured, show setup instructions
  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
              <Route path="/admin/register" element={<AdminRegister />} />
              <Route 
                path="/admin/profile" 
                element={
                  <AdminRoute>
                    <AdminProfile />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <RestaurantManagerRoute>
                    <RestaurantDashboardWrapper />
                  </RestaurantManagerRoute>
                } 
              />
              <Route 
                path="/admin/overview" 
                element={
                  <SuperAdminRoute>
                    <SuperAdminDashboard />
                  </SuperAdminRoute>
                } 
              />
              <Route 
                path="/admin/menu" 
                element={
                  <RestaurantManagerRoute>
                    <MenuManagement />
                  </RestaurantManagerRoute>
                } 
              />
              <Route 
                path="/admin/qr-codes" 
                element={
                  <RestaurantManagerRoute>
                    <QRCodeManagement />
                  </RestaurantManagerRoute>
                } 
              />
              <Route
                path="/admin/orders"
                element={
                  <RestaurantManagerRoute>
                    <OrderManagement />
                  </RestaurantManagerRoute>
                }
              />
              <Route
                path="/admin/order-history"
                element={
                  <RestaurantManagerRoute>
                    <OrderHistory />
                  </RestaurantManagerRoute>
                }
              />
              <Route 
                path="/admin/staff" 
                element={
                  <RestaurantManagerRoute>
                    <StaffManagement />
                  </RestaurantManagerRoute>
                } 
              />
              <Route 
                path="/admin/analytics" 
                element={
                  <RestaurantManagerRoute>
                    <Analytics />
                  </RestaurantManagerRoute>
                } 
              />
              <Route 
                path="/admin/reviews" 
                element={
                  <RestaurantManagerRoute>
                    <Reviews />
                  </RestaurantManagerRoute>
                } 
              />
              <Route 
                path="/admin/settings" 
                element={
                  <RestaurantManagerRoute>
                    <Settings />
                  </RestaurantManagerRoute>
                } 
              />
              
              {/* Super Admin Routes */}
              <Route 
                path="/admin/restaurants" 
                element={
                  <SuperAdminRoute>
                    <Restaurants />
                  </SuperAdminRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <RestaurantManagerRoute>
                    <UserManagement />
                  </RestaurantManagerRoute>
                } 
              />
              <Route 
                path="/admin/global-analytics" 
                element={
                  <SuperAdminRoute>
                    <GlobalAnalytics />
                  </SuperAdminRoute>
                } 
              />
              <Route 
                path="/admin/system-settings" 
                element={
                  <SuperAdminRoute>
                    <SystemSettings />
                  </SuperAdminRoute>
                } 
              />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
