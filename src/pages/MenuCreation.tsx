import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Plus, Edit, Trash2, Upload, ImageIcon, Star, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categorySchema = z.object({
  name: z.string().min(2, "Category name required"),
  description: z.string().optional(),
});

const menuItemSchema = z.object({
  name: z.string().min(2, "Item name required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().min(1, "Price is required"),
  category: z.string().min(1, "Category is required"),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  preparationTime: z.string().optional(),
  calories: z.string().optional(),
  allergens: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;
type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface Category {
  id: string;
  name: string;
  description: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image?: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isSpicy: boolean;
  isPopular: boolean;
  preparationTime?: string;
  calories?: string;
  allergens?: string;
}

export default function MenuCreation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const restaurantData = location.state?.restaurantData;
  
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "Appetizers", description: "Start your meal right" },
    { id: "2", name: "Main Courses", description: "Hearty and delicious mains" },
    { id: "3", name: "Desserts", description: "Sweet endings" },
    { id: "4", name: "Beverages", description: "Refreshing drinks" },
  ]);
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("1");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  const itemForm = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: selectedCategory,
      isVegetarian: false,
      isVegan: false,
      isSpicy: false,
      isPopular: false,
      preparationTime: "",
      calories: "",
      allergens: "",
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setItemImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onAddCategory = (data: CategoryFormData) => {
    const newCategory = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description || "",
    };
    setCategories([...categories, newCategory]);
    categoryForm.reset();
    setIsAddCategoryOpen(false);
    toast({
      title: "Category Added",
      description: `${data.name} has been added to your menu.`,
    });
  };

  const onAddMenuItem = (data: MenuItemFormData) => {
    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      isVegetarian: data.isVegetarian,
      isVegan: data.isVegan,
      isSpicy: data.isSpicy,
      isPopular: data.isPopular,
      preparationTime: data.preparationTime,
      calories: data.calories,
      allergens: data.allergens,
      image: itemImagePreview || undefined,
    };
    
    if (editingItem) {
      const updatedItem: MenuItem = {
        ...editingItem,
        ...data,
        image: itemImagePreview || editingItem.image,
      };
      setMenuItems(menuItems.map(item => 
        item.id === editingItem.id ? updatedItem : item
      ));
      toast({
        title: "Item Updated",
        description: `${data.name} has been updated.`,
      });
    } else {
      setMenuItems([...menuItems, newItem]);
      toast({
        title: "Item Added",
        description: `${data.name} has been added to your menu.`,
      });
    }
    
    itemForm.reset();
    setEditingItem(null);
    setItemImagePreview(null);
    setIsAddItemOpen(false);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    itemForm.reset(item);
    setItemImagePreview(item.image || null);
    setIsAddItemOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setMenuItems(menuItems.filter(item => item.id !== itemId));
    toast({
      title: "Item Deleted",
      description: "Menu item has been removed.",
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
    setMenuItems(menuItems.filter(item => item.category !== categoryId));
    toast({
      title: "Category Deleted",
      description: "Category and all its items have been removed.",
    });
  };

  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Create Menu for {restaurantData?.restaurantName || "Your Restaurant"}
          </h1>
          <p className="text-muted-foreground">Build your digital menu with categories and items</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Categories</CardTitle>
                <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Category</DialogTitle>
                      <DialogDescription>
                        Create a new category for your menu items
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...categoryForm}>
                      <form onSubmit={categoryForm.handleSubmit(onAddCategory)} className="space-y-4">
                        <FormField
                          control={categoryForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Appetizers" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Brief description of this category"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Add Category</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="group">
                    <Button
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className="w-full justify-between"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <span className="truncate">{category.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Menu Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Categories:</span>
                  <span className="font-medium">{categories.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Items:</span>
                  <span className="font-medium">{menuItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Popular Items:</span>
                  <span className="font-medium">{menuItems.filter(item => item.isPopular).length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Menu Items */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-xl">
                    {categories.find(cat => cat.id === selectedCategory)?.name || "Menu Items"}
                  </CardTitle>
                  <CardDescription>
                    {categories.find(cat => cat.id === selectedCategory)?.description}
                  </CardDescription>
                </div>
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? "Edit Menu Item" : "Add Menu Item"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingItem ? "Update the menu item details" : "Add a new item to your menu"}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...itemForm}>
                      <form onSubmit={itemForm.handleSubmit(onAddMenuItem)} className="space-y-4">
                        {/* Image Upload */}
                        <div className="space-y-2">
                          <Label htmlFor="item-image">Item Image</Label>
                          <div className="flex items-center space-x-4">
                            <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-accent/20">
                              {itemImagePreview ? (
                                <img src={itemImagePreview} alt="Item preview" className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                              )}
                            </div>
                            <Input
                              id="item-image"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="w-auto"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={itemForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Item Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Margherita Pizza" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={itemForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input placeholder="12.99" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={itemForm.control}
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
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={itemForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the dish, ingredients, preparation..."
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={itemForm.control}
                            name="preparationTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prep Time (Optional)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input placeholder="15 mins" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={itemForm.control}
                            name="calories"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Calories (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="350" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={itemForm.control}
                          name="allergens"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Allergens (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Gluten, Dairy, Nuts..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Switches */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={itemForm.control}
                            name="isVegetarian"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Vegetarian</FormLabel>
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
                            control={itemForm.control}
                            name="isVegan"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Vegan</FormLabel>
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
                            control={itemForm.control}
                            name="isSpicy"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Spicy</FormLabel>
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
                            control={itemForm.control}
                            name="isPopular"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Popular</FormLabel>
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

                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsAddItemOpen(false);
                              setEditingItem(null);
                              itemForm.reset();
                              setItemImagePreview(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingItem ? "Update Item" : "Add Item"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No items in this category
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your menu by adding your first item.
                    </p>
                    <Button onClick={() => setIsAddItemOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Item
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map((item) => (
                      <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex space-x-4">
                            <div className="w-20 h-20 bg-accent/20 rounded-lg flex-shrink-0 overflow-hidden">
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-foreground flex items-center gap-2">
                                    {item.name}
                                    {item.isPopular && (
                                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    )}
                                  </h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {item.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="font-semibold text-primary">${item.price}</span>
                                    {item.preparationTime && (
                                      <Badge variant="outline" className="text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {item.preparationTime}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.isVegetarian && (
                                      <Badge variant="secondary" className="text-xs">Veg</Badge>
                                    )}
                                    {item.isVegan && (
                                      <Badge variant="secondary" className="text-xs">Vegan</Badge>
                                    )}
                                    {item.isSpicy && (
                                      <Badge variant="destructive" className="text-xs">Spicy</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditItem(item)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => navigate("/restaurant-registration")}>
                Back to Registration
              </Button>
              <div className="space-x-2">
                <Button variant="outline">
                  Save as Draft
                </Button>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Menu Published!",
                      description: "Your menu is now live and QR codes are being generated.",
                    });
                    setTimeout(() => navigate("/"), 2000);
                  }}
                >
                  Publish Menu
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}