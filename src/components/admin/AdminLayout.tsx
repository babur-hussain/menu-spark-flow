import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminLayoutProps {
  children: React.ReactNode;
  userRole: "restaurant_manager" | "super_admin";
  restaurantName?: string;
}

export function AdminLayout({ children, userRole, restaurantName }: AdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-bold text-gradient">
                  {userRole === "super_admin" ? "Super Admin Dashboard" : `${restaurantName} Dashboard`}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {userRole === "super_admin" ? "Manage all restaurants" : "Manage your restaurant"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0">
                  3
                </Badge>
              </Button>
              
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
              
              <div className="text-sm">
                <p className="font-medium">John Doe</p>
                <p className="text-muted-foreground capitalize">{userRole.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex w-full pt-16">
          <AdminSidebar userRole={userRole} />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}