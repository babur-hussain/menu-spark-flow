import { useState, useEffect } from "react";
import { getCachedValue, setCachedValue } from "@/lib/fastCache";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Bell, User, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfileSettings } from "./UserProfileSettings";
import { supabase } from "@/integrations/supabase/client";

interface AdminLayoutProps {
  children: React.ReactNode;
  userRole: "restaurant_manager" | "super_admin";
  restaurantName?: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export function AdminLayout({ children, userRole, restaurantName }: AdminLayoutProps) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (user?.id) {
      // Wrap in a timeout to avoid infinite spinner if table/policies are misconfigured
      const run = async () => {
        try {
          await fetchUserProfile();
        } catch (e) {
          if (!cancelled) setIsLoadingProfile(false);
        }
      };
      run();
    } else {
      setIsLoadingProfile(false);
    }
    return () => { cancelled = true };
  }, [user?.id]);

  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setIsLoadingProfile(false);
        console.log('🚨 Profile loading timeout - likely schema issue 🚨');
        console.log('Please run the database schema update first');
      }, 3000); // 3 second timeout

      // Try to hydrate immediately from cache for instant header name
      const cacheKey = user?.id ? `user_profile:${user.id}` : '';
      if (cacheKey) {
        const cached = getCachedValue<UserProfile>(cacheKey, 60_000);
        if (cached) {
          setUserProfile(cached);
        }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      clearTimeout(timeoutId); // Clear timeout if successful

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        // If it's a schema error, create a default profile
        if (error.code === '42703') {
          console.log('User profiles table has schema issues, using default profile');
          setUserProfile({
            id: user?.id || '',
            email: user?.email || '',
            first_name: '',
            last_name: '',
            display_name: '',
            phone: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } else if (data) {
        setUserProfile(data);
        if (cacheKey) setCachedValue(cacheKey, data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const getDisplayName = () => {
    if (userProfile?.display_name) return userProfile.display_name;
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    if (userProfile?.first_name) return userProfile.first_name;
    return user?.email || "User";
  };

  const getDashboardTitle = () => {
    if (userRole === "super_admin") {
      return "Super Admin Dashboard";
    }
    if (restaurantName) {
      return `${restaurantName} Dashboard`;
    }
    return "Restaurant Dashboard";
  };

  return (
    <SidebarProvider defaultOpen={userRole === "super_admin" ? true : true}>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-bold text-gradient">
                  {getDashboardTitle()}
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
              
              <UserProfileSettings />
              
              <div className="text-sm">
                <p className="font-medium">
                  {isLoadingProfile ? "Loading..." : getDisplayName()}
                </p>
                <p className="text-muted-foreground capitalize">
                  {userRole.replace('_', ' ')}
                </p>
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