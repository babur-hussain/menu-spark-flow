import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Edit, Trash2, Upload, ImageIcon, Star, Clock, QrCode, Save, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';
import { formatCurrency } from '@/lib/utils';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name required'),
  description: z.string().optional(),
});

const menuItemSchema = z.object({
  name: z.string().min(2, 'Item name required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.string().min(1, 'Price is required'),
  category: z.string().min(1, 'Category is required'),
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
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  const itemForm = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      category: selectedCategory,
      isVegetarian: false,
      isVegan: false,
      isSpicy: false,
      isPopular: false,
      preparationTime: '',
      calories: '',
      allergens: '',
    },
  });

  useEffect(() => {
    if (restaurantData?.restaurantName) {
      initializeRestaurant();
    }
  }, [restaurantData]);

  useEffect(() => {
    if (restaurantId) {
      loadMenuData();
    }
  }, [restaurantId]);

  const initializeRestaurant = async () => {
    if (!restaurantData) return;

    try {
      // Check if user is authenticated (for demo purposes, we'll create without auth)
      const { data: existingRestaurant, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('name', restaurantData.restaurantName)
        .single();

      if (existingRestaurant) {
        setRestaurantId(existingRestaurant.id);
        return;
      }

      // Create new restaurant
      const { data: newRestaurant, error } = await supabase
        .from('restaurants')
        .insert({
          name: restaurantData.restaurantName,
          description: restaurantData.description,
          address: restaurantData.address,
          phone: restaurantData.phone,
          email: restaurantData.email,
          user_id: user?.id || '',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating restaurant:', error);
        toast({
          title: 'Error',
          description: 'Failed to create restaurant. Using local storage.',
          variant: 'destructive',
        });
        return;
      }

      setRestaurantId(newRestaurant.id);
      toast({
        title: 'Restaurant Created',
        description: 'Your restaurant has been set up successfully!',
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadMenuData = async () => {
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order');

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
      } else {
        setCategories(categoriesData.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || '',
        })));
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
      }

      // Load menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order');

      if (itemsError) {
        console.error('Error loading menu items:', itemsError);
      } else {
        setMenuItems(itemsData.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price.toString(),
          category: item.category_id,
          image: item.image_url || undefined,
          isVegetarian: item.dietary_info?.includes('vegetarian') || false,
          isVegan: item.dietary_info?.includes('vegan') || false,
          isSpicy: item.dietary_info?.includes('spicy') || false,
          isPopular: item.is_featured,
          preparationTime: item.preparation_time?.toString() || '',
          calories: '',
          allergens: item.allergens?.join(', ') || '',
        })));
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
    }
  };

  const generateQRCode = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      const orderUrl = `${window.location.origin}/order/${restaurantId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(orderUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // Update restaurant with QR code URL
      const { error } = await supabase
        .from('restaurants')
        .update({ qr_code_url: qrCodeDataUrl })
        .eq('id', restaurantId);

      if (error) {
        console.error('Error saving QR code:', error);
      }

      setQrCodeUrl(qrCodeDataUrl);
      toast({
        title: 'QR Code Generated',
        description: 'Your ordering QR code is ready!',
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onAddCategory = async (data: CategoryFormData) => {
    if (!restaurantId) return;

    try {
      const { data: newCategory, error } = await supabase
        .from('menu_categories')
        .insert({
          restaurant_id: restaurantId,
          name: data.name,
          description: data.description || '',
          sort_order: categories.length,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding category:', error);
        toast({
          title: 'Error',
          description: 'Failed to add category.',
          variant: 'destructive',
        });
        return;
      }

      const categoryData = {
        id: newCategory.id,
        name: newCategory.name,
        description: newCategory.description || '',
      };

      setCategories([...categories, categoryData]);
      if (!selectedCategory) {
        setSelectedCategory(categoryData.id);
      }
      
      categoryForm.reset();
      setIsAddCategoryOpen(false);
      toast({
        title: 'Category Added',
        description: `${data.name} has been added to your menu.`,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const onAddMenuItem = async (data: MenuItemFormData) => {
    if (!restaurantId || !data.category) return;

    try {
      const dietaryInfo = [];
      if (data.isVegetarian) dietaryInfo.push('vegetarian');
      if (data.isVegan) dietaryInfo.push('vegan');
      if (data.isSpicy) dietaryInfo.push('spicy');

      const allergens = data.allergens ? data.allergens.split(',').map(a => a.trim()) : [];

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: data.name,
            description: data.description,
            price: parseFloat(data.price),
            category_id: data.category,
            image_url: itemImagePreview || null,
            is_featured: data.isPopular,
            preparation_time: data.preparationTime ? parseInt(data.preparationTime) : null,
            dietary_info: dietaryInfo,
            allergens: allergens,
          })
          .eq('id', editingItem.id);

        if (error) {
          console.error('Error updating item:', error);
          toast({
            title: 'Error',
            description: 'Failed to update menu item.',
            variant: 'destructive',
          });
          return;
        }

        const updatedItem: MenuItem = {
          ...editingItem,
          ...data,
          image: itemImagePreview || editingItem.image,
        };
        setMenuItems(menuItems.map(item => 
          item.id === editingItem.id ? updatedItem : item
        ));
        toast({
          title: 'Item Updated',
          description: `${data.name} has been updated.`,
        });
      } else {
        // Add new item
        const { data: newItem, error } = await supabase
          .from('menu_items')
          .insert({
            restaurant_id: restaurantId,
            category_id: data.category,
            name: data.name,
            description: data.description,
            price: parseFloat(data.price),
            image_url: itemImagePreview || null,
            is_featured: data.isPopular,
            preparation_time: data.preparationTime ? parseInt(data.preparationTime) : null,
            dietary_info: dietaryInfo,
            allergens: allergens,
            sort_order: menuItems.length,
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding item:', error);
          toast({
            title: 'Error',
            description: 'Failed to add menu item.',
            variant: 'destructive',
          });
          return;
        }

        const menuItem: MenuItem = {
          id: newItem.id,
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

        setMenuItems([...menuItems, menuItem]);
        toast({
          title: 'Item Added',
          description: `${data.name} has been added to your menu.`,
        });
      }
      
      itemForm.reset();
      setEditingItem(null);
      setItemImagePreview(null);
      setIsAddItemOpen(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    itemForm.reset(item);
    setItemImagePreview(item.image || null);
    setIsAddItemOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting item:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete menu item.',
          variant: 'destructive',
        });
        return;
      }

      setMenuItems(menuItems.filter(item => item.id !== itemId));
      toast({
        title: 'Item Deleted',
        description: 'Menu item has been removed.',
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('Error deleting category:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete category.',
          variant: 'destructive',
        });
        return;
      }

      setCategories(categories.filter(cat => cat.id !== categoryId));
      setMenuItems(menuItems.filter(item => item.category !== categoryId));
      
      // Set new selected category if current one was deleted
      if (selectedCategory === categoryId) {
        const remainingCategories = categories.filter(cat => cat.id !== categoryId);
        setSelectedCategory(remainingCategories.length > 0 ? remainingCategories[0].id : '');
      }
      
      toast({
        title: 'Category Deleted',
        description: 'Category and all its items have been removed.',
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

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

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `${restaurantData?.restaurantName || 'restaurant'}-qr-code.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Create Menu for {restaurantData?.restaurantName || 'Your Restaurant'}
              </h1>
              <p className="text-muted-foreground">Build your digital menu with categories and items</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateQRCode} disabled={loading || !restaurantId}>
                <QrCode className="w-4 h-4 mr-2" />
                {loading ? 'Generating...' : 'Generate QR Code'}
              </Button>
            </div>
          </div>
        </div>

        {qrCodeUrl && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>QR Code for Ordering</CardTitle>
              <CardDescription>
                Customers can scan this QR code to view your menu and place orders
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
              <div className="flex flex-col gap-2">
                <Button onClick={downloadQRCode} variant="outline">
                  Download QR Code
                </Button>
                <p className="text-sm text-muted-foreground">
                  Place this QR code on tables for easy ordering
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
                      variant={selectedCategory === category.id ? 'default' : 'ghost'}
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
                    {categories.find(cat => cat.id === selectedCategory)?.name || 'Menu Items'}
                  </CardTitle>
                  <CardDescription>
                    {categories.find(cat => cat.id === selectedCategory)?.description}
                  </CardDescription>
                </div>
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedCategory}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingItem ? 'Update the menu item details' : 'Add a new item to your menu'}
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
                                    <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
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
                                  placeholder="Describe your menu item..."
                                  className="resize-none"
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
                                <FormLabel>Prep Time (minutes)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input placeholder="15" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={itemForm.control}
                            name="allergens"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Allergens</FormLabel>
                                <FormControl>
                                  <Input placeholder="nuts, dairy, gluten" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Dietary Options */}
                        <div className="space-y-3">
                          <Label>Dietary Options</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={itemForm.control}
                              name="isVegetarian"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                      Vegetarian
                                    </FormLabel>
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
                                    <FormLabel className="text-base">
                                      Vegan
                                    </FormLabel>
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
                                    <FormLabel className="text-base">
                                      Spicy
                                    </FormLabel>
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
                                    <FormLabel className="text-base">
                                      Popular
                                    </FormLabel>
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

                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsAddItemOpen(false);
                              setEditingItem(null);
                              setItemImagePreview(null);
                              itemForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingItem ? 'Update Item' : 'Add Item'}
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
                    <p className="text-muted-foreground mb-4">
                      {selectedCategory ? 'No items in this category yet.' : 'Create a category first.'}
                    </p>
                    {selectedCategory && (
                      <Button onClick={() => setIsAddItemOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Item
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                      <Card key={item.id} className="group hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          {item.image && (
                            <div className="aspect-video rounded-lg overflow-hidden mb-3">
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                              <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditItem(item)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-lg">{formatCurrency(item.price)}</span>
                              <div className="flex gap-1">
                                {item.isPopular && (
                                  <Badge variant="secondary">
                                    <Star className="w-3 h-3 mr-1" />
                                    Popular
                                  </Badge>
                                )}
                                {item.isVegetarian && (
                                  <Badge variant="outline">Vegetarian</Badge>
                                )}
                                {item.isVegan && (
                                  <Badge variant="outline">Vegan</Badge>
                                )}
                                {item.isSpicy && (
                                  <Badge variant="outline">Spicy</Badge>
                                )}
                              </div>
                            </div>
                            {item.preparationTime && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                {item.preparationTime} mins
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            Save as Draft
          </Button>
          <Button onClick={() => navigate('/admin/dashboard')} disabled={menuItems.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            Publish Menu
          </Button>
        </div>
      </div>
    </div>
  );
}