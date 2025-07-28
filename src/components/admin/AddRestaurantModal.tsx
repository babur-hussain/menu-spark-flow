import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus } from "lucide-react";

interface AddRestaurantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestaurantAdded: () => void;
}

interface RestaurantFormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  is_active: boolean;
}

export function AddRestaurantModal({ open, onOpenChange, onRestaurantAdded }: AddRestaurantModalProps) {
  console.log('AddRestaurantModal rendered, open:', open);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Restaurant name and email are required.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone format (basic validation)
    if (formData.phone && !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-()]/g, ''))) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if user is authenticated
      if (!user?.id) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to add a restaurant.",
          variant: "destructive",
        });
        return;
      }

      // Check if this is a default user (not a real Supabase user)
      const isDefaultUser = localStorage.getItem('is_default_user') === 'true';
      
      if (isDefaultUser) {
        toast({
          title: "Default User Limitation",
          description: "Restaurants cannot be added using default credentials. Please register a real account.",
          variant: "destructive",
        });
        return;
      }

      // Check if restaurant with same name already exists
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('name', formData.name.trim())
        .single();

      if (existingRestaurant) {
        toast({
          title: "Restaurant Already Exists",
          description: "A restaurant with this name already exists.",
          variant: "destructive",
        });
        return;
      }

      // Check if email is already in use
      if (formData.email) {
        const { data: existingEmail } = await supabase
          .from('restaurants')
          .select('id')
          .eq('email', formData.email.trim())
          .single();

        if (existingEmail) {
          toast({
            title: "Email Already In Use",
            description: "This email address is already associated with another restaurant.",
            variant: "destructive",
          });
          return;
        }
      }

      // Insert new restaurant with the current user as the owner
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          website: formData.website.trim(),
          is_active: formData.is_active,
          user_id: user.id, // Use the current authenticated user
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding restaurant:', error);
        toast({
          title: "Error",
          description: "Failed to add restaurant. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Restaurant "${formData.name}" has been added successfully.`,
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        is_active: true,
      });

      // Close modal and refresh data
      onOpenChange(false);
      onRestaurantAdded();
    } catch (error) {
      console.error('Error adding restaurant:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RestaurantFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Restaurant</DialogTitle>
          <DialogDescription>
            Add a new restaurant to the platform. Fill in the required information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter restaurant name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="restaurant@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the restaurant"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 Main St, City, State, ZIP"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1-555-123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://restaurant.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_id">Restaurant Owner</Label>
            <Input
              id="user_id"
              value={user?.email || 'Not available'}
              disabled
              placeholder="Current user will be the owner"
            />
            <p className="text-xs text-muted-foreground">
              {localStorage.getItem('is_default_user') === 'true' 
                ? 'Default users cannot add restaurants. Please register a real account.'
                : 'The current logged-in user will be assigned as the restaurant owner.'
              }
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Active Restaurant</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Restaurant
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 