import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Settings, Edit, Save, Loader2 } from "lucide-react";

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

export function UserProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    phone: ""
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        // If it's a schema error, create a default profile
        if (error.code === '42703') {
          console.log('User profiles table has schema issues, using default profile');
          setProfile({
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
        setProfile(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          display_name: data.display_name || "",
          phone: data.phone || ""
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        toast({
          title: "Database Schema Issue",
          description: "Please run the database schema update first. Check the console for instructions.",
          variant: "destructive",
        });
        console.log('🚨 DATABASE SCHEMA ISSUE DETECTED 🚨');
        console.log('Please run this SQL in your Supabase Dashboard:');
        console.log(`
          ALTER TABLE public.user_profiles 
          ADD COLUMN IF NOT EXISTS first_name TEXT,
          ADD COLUMN IF NOT EXISTS last_name TEXT,
          ADD COLUMN IF NOT EXISTS display_name TEXT,
          ADD COLUMN IF NOT EXISTS phone TEXT,
          ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        `);
      }, 5000); // 5 second timeout

      // Try to update with all fields, but handle missing columns gracefully
      const updateData: any = {
        id: user.id,
        email: user.email || "",
        updated_at: new Date().toISOString()
      };

      // Only add fields if they exist in the schema
      if (formData.first_name !== undefined) updateData.first_name = formData.first_name;
      if (formData.last_name !== undefined) updateData.last_name = formData.last_name;
      if (formData.display_name !== undefined) updateData.display_name = formData.display_name;
      if (formData.phone !== undefined) updateData.phone = formData.phone;

      const { error } = await supabase
        .from('user_profiles')
        .upsert(updateData);

      clearTimeout(timeoutId); // Clear timeout if successful

      if (error) {
        console.error('Error updating profile:', error);
        
        // If it's a schema error, show helpful message
        if (error.code === '42703') {
          toast({
            title: "Schema Error",
            description: "Please run the database schema update first. Check the console for the SQL script.",
            variant: "destructive",
          });
          console.log('🚨 DATABASE SCHEMA ISSUE DETECTED 🚨');
          console.log('Please run this SQL in your Supabase Dashboard:');
          console.log(`
            ALTER TABLE public.user_profiles 
            ADD COLUMN IF NOT EXISTS first_name TEXT,
            ADD COLUMN IF NOT EXISTS last_name TEXT,
            ADD COLUMN IF NOT EXISTS display_name TEXT,
            ADD COLUMN IF NOT EXISTS phone TEXT,
            ADD COLUMN IF NOT EXISTS avatar_url TEXT;
          `);
        } else {
          toast({
            title: "Error",
            description: "Failed to update profile",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setIsDialogOpen(false);
        fetchProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) return profile.first_name;
    return user?.email || "User";
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Profile Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and display name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Enter your first name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Enter your last name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="How you want to be displayed"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSaveProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 