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
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/contexts/AuthContext";
import { menuService, MenuItem, CreateMenuItemData } from "@/lib/menuService";

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

  // Fetch menu items on component mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!user?.restaurant_id) return;
      
      try {
        setIsLoading(true);
        const items = await menuService.getMenuItems(user.restaurant_id);
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

    fetchMenuItems();
  }, [user?.restaurant_id, toast]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onSubmit = async (data: MenuItemFormData) => {
    if (!user?.restaurant_id) {
      toast({
        title: "Error",
        description: "Restaurant ID not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const menuItemData: CreateMenuItemData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category: data.category,
        preparation_time: parseInt(data.preparation_time),
        calories: data.calories ? parseInt(data.calories) : undefined,
        allergens: data.allergens ? data.allergens.split(',').map(a => a.trim()) : [],
        is_vegetarian: data.is_vegetarian,
        is_vegan: data.is_vegan,
        is_gluten_free: data.is_gluten_free,
        is_available: data.is_available,
        image_url: data.image_url,
      };

      if (editingItem) {
        const updatedItem = await menuService.updateMenuItem(editingItem.id, menuItemData);
        setMenuItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
        toast({
          title: "Menu Item Updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        const newItem = await menuService.createMenuItem(user.restaurant_id, menuItemData);
        setMenuItems(prev => [newItem, ...prev]);
        toast({
          title: "Menu Item Added",
          description: `${data.name} has been added to your menu.`,
        });
      }

      setIsAddDialogOpen(false);
      setEditingItem(null);
      form.reset();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: "Error",
        description: "Failed to save menu item. Please try again.",
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
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    try {
      await menuService.deleteMenuItem(itemId);
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Menu Item Deleted",
        description: "The menu item has been removed successfully.",
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
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout userRole="restaurant_manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
            <p className="text-muted-foreground">
              Manage your restaurant's menu items, categories, and availability
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem 
                      ? "Update the menu item details below."
                      : "Add a new item to your restaurant's menu."
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Classic Caesar Salad" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                                {categories.map(category => (
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
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the dish, ingredients, and preparation method..."
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preparation_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prep Time (min)</FormLabel>
                            <FormControl>
                              <Input placeholder="15" type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="calories"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calories</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional" type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="allergens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergens (comma-separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Dairy, Gluten, Nuts" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <h4 className="font-medium">Dietary Options</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="is_vegetarian"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Vegetarian</FormLabel>
                                <div className="text-xs text-muted-foreground">
                                  Suitable for vegetarians
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="is_vegan"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Vegan</FormLabel>
                                <div className="text-xs text-muted-foreground">
                                  No animal products
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="is_gluten_free"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Gluten Free</FormLabel>
                                <div className="text-xs text-muted-foreground">
                                  No gluten ingredients
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="is_available"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Available</FormLabel>
                            <div className="text-xs text-muted-foreground">
                              Show this item on the menu
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setEditingItem(null);
                          form.reset();
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {editingItem ? "Update Item" : "Add Item"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <LogoutButton variant="outline" />
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading menu items...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {item.description}
                    </CardDescription>
                  </div>
                  <Badge variant={item.is_available ? "default" : "secondary"}>
                    {item.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{item.category}</Badge>
                  {item.is_vegetarian && <Badge variant="outline" className="bg-green-50 text-green-700">Veg</Badge>}
                  {item.is_vegan && <Badge variant="outline" className="bg-green-50 text-green-700">Vegan</Badge>}
                  {item.is_gluten_free && <Badge variant="outline" className="bg-blue-50 text-blue-700">GF</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium text-foreground">${item.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{item.preparation_time} min</span>
                    </div>
                    {item.calories && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        <span>{item.calories} cal</span>
                      </div>
                    )}
                  </div>
                </div>

                {item.allergens && item.allergens.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Allergens:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.allergens.map((allergen, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAvailability(item.id)}
                    className="flex-1"
                  >
                    {item.is_available ? "Hide" : "Show"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          </div>
        )}

        {!isLoading && filteredItems.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No menu items found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first menu item."
                }
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Menu Item
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
} 