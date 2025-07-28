import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
<<<<<<< HEAD
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute, RestaurantManagerRoute, SuperAdminRoute } from "@/components/auth/ProtectedRoute";
=======
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
import Index from "./pages/Index";
import RestaurantRegistration from "./pages/RestaurantRegistration";
import MenuCreation from "./pages/MenuCreation";
import Order from "./pages/Order";
import AdminLogin from "./pages/admin/AdminLogin";
<<<<<<< HEAD
import AdminRegister from "./pages/admin/AdminRegister";
import AdminProfile from "./pages/admin/AdminProfile";
import RestaurantDashboard from "./pages/admin/RestaurantDashboard";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import MenuManagement from "./pages/admin/MenuManagement";
import QRCodeManagement from "./pages/admin/QRCodeManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import StaffManagement from "./pages/admin/StaffManagement";
import Analytics from "./pages/admin/Analytics";
import Reviews from "./pages/admin/Reviews";
import Settings from "./pages/admin/Settings";
=======
import RestaurantDashboard from "./pages/admin/RestaurantDashboard";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
<<<<<<< HEAD
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
                  <RestaurantDashboard />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
=======
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
>>>>>>> 3c5493f9f454d58d4b537e7e16805a988c12a488
  </QueryClientProvider>
);

export default App;
