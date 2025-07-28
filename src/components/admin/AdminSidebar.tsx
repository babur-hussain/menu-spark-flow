import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Star,
  Building,
  UserCog,
  Globe,
  TrendingUp,
  Clock,
} from "lucide-react";

interface AdminSidebarProps {
  userRole: "restaurant_manager" | "super_admin";
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Force sidebar to be open for Super Admin users
  const isSidebarOpen = userRole === "super_admin" ? true : sidebarOpen;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const restaurantManagerItems = [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Menu Management", url: "/admin/menu", icon: UtensilsCrossed },
    { title: "QR Codes", url: "/admin/qr-codes", icon: QrCode },
    { title: "Orders", url: "/admin/orders", icon: CreditCard },
    { title: "Order History", url: "/admin/order-history", icon: Clock },
    { title: "Staff", url: "/admin/staff", icon: Users },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Reviews", url: "/admin/reviews", icon: Star },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  const superAdminItems = [
    { title: "Overview", url: "/admin/overview", icon: Globe },
    { title: "Restaurants", url: "/admin/restaurants", icon: Building },
    { title: "User Management", url: "/admin/users", icon: UserCog },
    { title: "Analytics", url: "/admin/global-analytics", icon: TrendingUp },
    { title: "System Settings", url: "/admin/system-settings", icon: Settings },
  ];

  const items = userRole === "super_admin" ? superAdminItems : restaurantManagerItems;
  const isExpanded = items.some((i) => isActive(i.url));

  return (
    <Sidebar className={!isSidebarOpen ? "w-14" : "w-60"}>
      <SidebarContent className="h-full">
        <SidebarGroup>
          <SidebarGroupLabel>
            {userRole === "super_admin" ? "System Management" : "Restaurant Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {isSidebarOpen && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}