import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  UtensilsCrossed, 
  DollarSign, 
  Star,
  Clock,
  Tag,
  Image as ImageIcon,
  Upload,
  Save,
  X,
  Loader2,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/contexts/AuthContext";
import { menuService, MenuItem, CreateMenuItemData } from "@/lib/menuService";
import { restaurantService } from "@/lib/restaurantService";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from '@/lib/utils';

const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().min(1, "Price is required"),
  category: z.string().min(1, "Category is required"),
  preparation_time: z.string().min(1, "Preparation time is required"),
  calories: z.string().optional(),
  allergens: z.string().optional(),
  is_vegetarian: z.boolean().default(false),
  is_vegan: z.boolean().default(false),
  is_gluten_free: z.boolean().default(false),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_spicy: z.boolean().default(false),
  dietary_info: z.array(z.string()).default([]),
  addons: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number()
  })).default([]),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number()
  })).default([]),
  badges: z.array(z.string()).default([]),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  preparation_time: number;
  calories?: number;
  allergens?: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_available: boolean;
  is_featured: boolean;
  is_spicy: boolean;
  dietary_info: string[];
  addons: Array<{id: string; name: string; price: number}>;
  variants: Array<{id: string; name: string; price: number}>;
  badges: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

const categories = [
  "Appetizers",
  "Main Course",
  "Desserts",
  "Beverages",
  "Salads",
  "Soups",
  "Pasta",
  "Pizza",
  "Burgers",
  "Seafood",
  "Grill",
  "Kids Menu"
];

export default function MenuManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  interface Restaurant { id: string; name: string }
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      preparation_time: "",
      calories: "",
      allergens: "",
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_available: true,
    },
  });

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoadingRestaurants(true);
        const restaurants = await restaurantService.getRestaurants(user.id);
        setRestaurants(restaurants);
        
        // Get the last selected restaurant from localStorage
        const lastSelectedRestaurantId = localStorage.getItem('selectedRestaurantId');
        
        if (lastSelectedRestaurantId && restaurants.some(r => r.id === lastSelectedRestaurantId)) {
          const selectedRestaurant = restaurants.find(r => r.id === lastSelectedRestaurantId);
          setCurrentRestaurant(selectedRestaurant);
        } else if (restaurants.length > 0) {
          // If no saved restaurant or saved restaurant doesn't exist, use the first one
          setCurrentRestaurant(restaurants[0]);
          localStorage.setItem('selectedRestaurantId', restaurants[0].id);
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setIsLoadingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, [user?.id]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!user || !currentRestaurant) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching menu items for restaurant:', currentRestaurant.id);
        
        const items = await menuService.getMenuItems(currentRestaurant.id);
        console.log('Fetched menu items:', items);
        setMenuItems(items);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        toast({
          title: "Error",
          description: "Failed to load menu items. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (currentRestaurant) {
      fetchMenuItems();
    }
  }, [user, currentRestaurant, toast]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onSubmit = async (data: MenuItemFormData) => {
    if (!currentRestaurant) {
      toast({
        title: "Error",
        description: "Please select a restaurant first.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Collect selected add-ons
      const selectedAddons = [
        { id: 'cheese', name: 'Extra Cheese', price: 1.5 },
        { id: 'fries', name: 'French Fries', price: 2.0 },
        { id: 'drink', name: 'Soft Drink', price: 2.5 },
        { id: 'sauce', name: 'Extra Sauce', price: 0.5 },
        { id: 'bacon', name: 'Bacon', price: 3.0 },
        { id: 'guacamole', name: 'Guacamole', price: 1.0 },
      ].filter(addon => {
        const checkbox = document.getElementById(`addon-${addon.id}`) as HTMLInputElement;
        return checkbox?.checked;
      });

      // Collect selected variants
      const selectedVariants = [
        { id: 'regular', name: 'Regular', price: 0 },
        { id: 'large', name: 'Large', price: 3.0 },
        { id: 'spicy', name: 'Spicy', price: 0 },
        { id: 'mild', name: 'Mild', price: 0 },
        { id: 'extra_spicy', name: 'Extra Spicy', price: 0 },
        { id: 'family_size', name: 'Family Size', price: 5.0 },
      ].filter(variant => {
        const checkbox = document.getElementById(`variant-${variant.id}`) as HTMLInputElement;
        return checkbox?.checked;
      });

      // Collect selected badges
      const selectedBadges = [
        'Bestseller', 'New', 'Chef Special', 'Popular', 'Limited Time', 'Seasonal', 'Organic', 'Local'
      ].filter(badge => {
        const checkbox = document.getElementById(`badge-${badge.toLowerCase().replace(' ', '-')}`) as HTMLInputElement;
        return checkbox?.checked;
      });

      // Collect dietary information
      const dietaryInfo = [
        'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher', 'low-carb', 'keto-friendly'
      ].filter(diet => {
        const checkbox = document.getElementById(`diet-${diet}`) as HTMLInputElement;
        return checkbox?.checked;
      });

      const menuItemData: CreateMenuItemData = {
        restaurant_id: currentRestaurant.id,
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category: data.category,
        preparation_time: parseInt(data.preparation_time),
        calories: data.calories ? parseInt(data.calories) : undefined,
        allergens: data.allergens ? data.allergens.split(',').map(a => a.trim()) : undefined,
        is_vegetarian: data.is_vegetarian,
        is_vegan: data.is_vegan,
        is_gluten_free: data.is_gluten_free,
        is_available: data.is_available,
        is_featured: data.is_featured,
        is_spicy: data.is_spicy,
        dietary_info: dietaryInfo,
        addons: selectedAddons,
        variants: selectedVariants,
        badges: selectedBadges,
      };

      await menuService.createMenuItem(currentRestaurant.id, menuItemData);

      toast({
        title: "Success",
        description: "Menu item created successfully!",
      });

      setIsAddDialogOpen(false);
      form.reset();
      fetchMenuItems();
    } catch (error) {
      console.error("Error creating menu item:", error);
      toast({
        title: "Error",
        description: "Failed to create menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      preparation_time: item.preparation_time.toString(),
      calories: item.calories?.toString() || "",
      allergens: item.allergens?.join(', ') || "",
      is_vegetarian: item.is_vegetarian,
      is_vegan: item.is_vegan,
      is_gluten_free: item.is_gluten_free,
      is_available: item.is_available,
    });
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    
    try {
      await menuService.deleteMenuItem(itemId);
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Success",
        description: "Menu item deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleAvailability = async (itemId: string) => {
    try {
      const item = menuItems.find(item => item.id === itemId);
      if (!item) return;
      
      const updatedItem = await menuService.toggleMenuItemAvailability(itemId, !item.is_available);
      setMenuItems(prev => prev.map(item => 
        item.id === itemId ? updatedItem : item
      ));
      
      toast({
        title: "Success",
        description: `Menu item ${updatedItem.is_available ? 'enabled' : 'disabled'} successfully!`,
      });
    } catch (error) {
      console.error('Error toggling menu item availability:', error);
      toast({
        title: "Error",
        description: "Failed to update menu item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRestaurantChange = (restaurantId: string) => {
    const selectedRestaurant = restaurants.find(r => r.id === restaurantId);
    if (selectedRestaurant) {
      setCurrentRestaurant(selectedRestaurant);
      localStorage.setItem('selectedRestaurantId', restaurantId);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout userRole="restaurant_manager">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading menu items...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userRole="restaurant_manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
            <p className="text-muted-foreground">
              Manage your restaurant's menu items, categories, and availability.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
            <LogoutButton />
          </div>
        </div>

        {/* Restaurant Selector */}
        {!isLoadingRestaurants && restaurants.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="restaurant-select" className="text-sm font-medium">
                    Select Restaurant:
                  </Label>
                </div>
                <Select 
                  value={currentRestaurant?.id || ""} 
                  onValueChange={handleRestaurantChange}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        {currentRestaurant && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-700">
                <strong>Current Restaurant:</strong> {currentRestaurant.name} (ID: {currentRestaurant.id})
              </p>
              <p className="text-sm text-blue-600">
                <strong>Menu Items Found:</strong> {menuItems.length}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-4">
                <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No menu items found</h3>
                  <p className="text-muted-foreground mt-2">
                    Get started by adding your first menu item.
                  </p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Menu Item
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {item.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.is_available ? "default" : "secondary"}>
                        {item.is_available ? "Available" : "Unavailable"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAvailability(item.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-semibold">{formatCurrency(item.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Category</span>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Prep Time</span>
                      <span className="text-sm">{item.preparation_time} min</span>
                    </div>
                    {item.calories && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Calories</span>
                        <span className="text-sm">{item.calories} cal</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {item.is_vegetarian && <Badge variant="secondary" className="text-xs">Vegetarian</Badge>}
                      {item.is_vegan && <Badge variant="secondary" className="text-xs">Vegan</Badge>}
                      {item.is_gluten_free && <Badge variant="secondary" className="text-xs">Gluten-Free</Badge>}
                      {item.is_featured && <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Featured</Badge>}
                      {item.is_spicy && <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">Spicy</Badge>}
                      {item.badges?.map((badge, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                    {item.dietary_info && item.dietary_info.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.dietary_info.map((diet, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {diet}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {(item.addons?.length > 0 || item.variants?.length > 0) && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                        <div className="font-medium mb-1">Customization Options:</div>
                        {item.addons?.length > 0 && (
                          <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Add-ons:</span> {item.addons.map(a => a.name).join(', ')}
                          </div>
                        )}
                        {item.variants?.length > 0 && (
                          <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Variants:</span> {item.variants.map(v => v.name).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Menu Item Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
              <DialogDescription>
                Create a new menu item for your restaurant.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter item name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter item description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preparation_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preparation Time (minutes)</FormLabel>
                        <FormControl>
                          <Input placeholder="15" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="calories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="250" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="allergens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergens (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Nuts, Dairy, Gluten" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="is_vegetarian"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Vegetarian</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_vegan"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Vegan</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_gluten_free"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Gluten-Free</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_available"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Available</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Featured</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_spicy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Spicy</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Customization Options */}
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-semibold">Customization Options</h3>
                  
                  {/* Add-ons Section */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Add-ons</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: 'cheese', name: 'Extra Cheese', price: 1.5 },
                        { id: 'fries', name: 'French Fries', price: 2.0 },
                        { id: 'drink', name: 'Soft Drink', price: 2.5 },
                        { id: 'sauce', name: 'Extra Sauce', price: 0.5 },
                        { id: 'bacon', name: 'Bacon', price: 3.0 },
                        { id: 'guacamole', name: 'Guacamole', price: 1.0 },
                      ].map((addon) => (
                        <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`addon-${addon.id}`}
                              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <Label htmlFor={`addon-${addon.id}`} className="text-sm font-medium">
                              {addon.name}
                            </Label>
                          </div>
                          <span className="text-sm text-orange-600 font-semibold">+${addon.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Variants Section */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Size & Style Variants</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: 'regular', name: 'Regular', price: 0 },
                        { id: 'large', name: 'Large', price: 3.0 },
                        { id: 'spicy', name: 'Spicy', price: 0 },
                        { id: 'mild', name: 'Mild', price: 0 },
                        { id: 'extra_spicy', name: 'Extra Spicy', price: 0 },
                        { id: 'family_size', name: 'Family Size', price: 5.0 },
                      ].map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`variant-${variant.id}`}
                              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <Label htmlFor={`variant-${variant.id}`} className="text-sm font-medium">
                              {variant.name}
                            </Label>
                          </div>
                          {variant.price > 0 && (
                            <span className="text-sm text-orange-600 font-semibold">+${variant.price.toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Badges Section */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Item Badges</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        'Bestseller',
                        'New',
                        'Chef Special',
                        'Popular',
                        'Limited Time',
                        'Seasonal',
                        'Organic',
                        'Local'
                      ].map((badge) => (
                        <div key={badge} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`badge-${badge.toLowerCase().replace(' ', '-')}`}
                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <Label htmlFor={`badge-${badge.toLowerCase().replace(' ', '-')}`} className="text-sm">
                            {badge}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Information */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Dietary Information</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        'vegetarian',
                        'vegan',
                        'gluten-free',
                        'dairy-free',
                        'nut-free',
                        'halal',
                        'kosher',
                        'low-carb',
                        'keto-friendly'
                      ].map((diet) => (
                        <div key={diet} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`diet-${diet}`}
                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <Label htmlFor={`diet-${diet}`} className="text-sm capitalize">
                            {diet.replace('-', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Menu Item
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}