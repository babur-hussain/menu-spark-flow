import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = "outline",
  size = "default",
  className = "",
  showIcon = true,
  children = "Logout"
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      const result = await logout();
      
      if (result.success) {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
        
        // Redirect to login page
        navigate("/admin/login");
      } else {
        toast({
          title: "Logout Failed",
          description: result.error || "An error occurred during logout.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {showIcon && <LogOut className="w-4 h-4 mr-2" />}
      {isLoading ? "Logging out..." : children}
    </Button>
  );
}; 