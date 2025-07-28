import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Building,
  Crown,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LogoutButton } from "./LogoutButton";

interface ProfileDropdownProps {
  className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ className = "" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) {
    return null;
  }

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "super_admin":
        return { label: "Super Admin", icon: Crown, color: "bg-purple-100 text-purple-800" };
      case "restaurant_manager":
        return { label: "Restaurant Manager", icon: Building, color: "bg-blue-100 text-blue-800" };
      default:
        return { label: "User", icon: User, color: "bg-gray-100 text-gray-800" };
    }
  };

  const roleInfo = getRoleDisplay(user.role);

  const handleDashboardClick = () => {
    setIsOpen(false);
    if (user.role === "super_admin") {
      navigate("/admin/overview");
    } else {
      navigate("/admin/dashboard");
    }
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    // Navigate to profile page (to be implemented)
    navigate("/admin/profile");
  };

  const handleLogout = async () => {
    setIsOpen(false);
    const result = await logout();
    if (result.success) {
      navigate("/admin/login");
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center space-x-2 px-3 py-2 hover:bg-accent"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={user.email} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getUserInitials(user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex sm:flex-col sm:items-start">
              <span className="text-sm font-medium">{user.email}</span>
              <Badge variant="secondary" className="text-xs">
                {roleInfo.label}
              </Badge>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.email}</p>
              <div className="flex items-center space-x-2">
                <roleInfo.icon className="h-3 w-3" />
                <p className="text-xs leading-none text-muted-foreground">
                  {roleInfo.label}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleDashboardClick}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleProfileClick}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}; 