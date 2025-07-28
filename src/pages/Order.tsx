import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, ShoppingCart, Star, Clock, Leaf, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_featured: boolean;
  preparation_time?: number;
  dietary_info?: string[];
  allergens?: string[];
  category_id: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  special_instructions?: string;
}

export default function Order() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    tableNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (restaurantId) {
      loadRestaurantData();
    }
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);

      // Load restaurant info
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();

      if (restaurantError || !restaurantData) {
        toast({
          title: 'Restaurant Not Found',
          description: 'This restaurant is not available.',
          variant: 'destructive',
        });
        return;
      }

      setRestaurant(restaurantData);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
      } else {
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
      }

      // Load menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('sort_order');

      if (menuError) {
        console.error('Error loading menu:', menuError);
      } else {
        setMenuItems(menuData);
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load restaurant menu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem, specialInstructions?: string) => {
    const existingItem = cart.find(cartItem => 
      cartItem.id === item.id && 
      cartItem.special_instructions === specialInstructions
    );

    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id && cartItem.special_instructions === specialInstructions
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        special_instructions: specialInstructions,
      }]);
    }

    toast({
      title: 'Added to Cart',
      description: `${item.name} added to your order.`,
    });
  };

  const removeFromCart = (cartItemId: string, specialInstructions?: string) => {
    const existingItem = cart.find(cartItem => 
      cartItem.id === cartItemId && 
      cartItem.special_instructions === specialInstructions
    );

    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(cartItem =>
        cartItem.id === cartItemId && cartItem.special_instructions === specialInstructions
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => 
        !(cartItem.id === cartItemId && cartItem.special_instructions === specialInstructions)
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (!restaurant || cart.length === 0) return;

    if (!customerInfo.name || !customerInfo.phone) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your name and phone number.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_email: customerInfo.email || null,
          table_number: customerInfo.tableNumber || null,
          total_amount: getCartTotal(),
          notes: customerInfo.notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        toast({
          title: 'Order Failed',
          description: 'Failed to place your order. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Add order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.special_instructions || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error adding order items:', itemsError);
        toast({
          title: 'Order Failed',
          description: 'Failed to save order items. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Order Placed!',
        description: `Your order #${orderData.id.slice(-8)} has been placed successfully.`,
      });

      // Clear cart and customer info
      setCart([]);
      setCustomerInfo({
        name: '',
        phone: '',
        email: '',
        tableNumber: '',
        notes: '',
      });
      setShowCheckout(false);
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Restaurant Not Found</h1>
          <p className="text-muted-foreground">This restaurant is not available.</p>
        </div>
      </div>
    );
  }

  const filteredItems = menuItems.filter(item => item.category_id === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Restaurant Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{restaurant.name}</h1>
          <p className="text-muted-foreground mb-2">{restaurant.description}</p>
          <p className="text-sm text-muted-foreground">{restaurant.address}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Menu Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Order</span>
                    <Badge variant="secondary">{getCartItemCount()} items</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {cart.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          {item.special_instructions && (
                            <p className="text-xs text-muted-foreground">
                              Note: {item.special_instructions}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => removeFromCart(item.id, item.special_instructions)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              const menuItem = menuItems.find(mi => mi.id === item.id);
                              if (menuItem) addToCart(menuItem, item.special_instructions);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total:</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => setShowCheckout(true)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Menu Items */}
          <div className="lg:col-span-3">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">
                {categories.find(cat => cat.id === selectedCategory)?.name || 'Menu Items'}
              </h2>
              <p className="text-muted-foreground">
                {categories.find(cat => cat.id === selectedCategory)?.description}
              </p>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No items available in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredItems.map((item) => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                placeholder="Your phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table">Table Number (Optional)</Label>
              <Input
                id="table"
                value={customerInfo.tableNumber}
                onChange={(e) => setCustomerInfo({...customerInfo, tableNumber: e.target.value})}
                placeholder="Table number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Special Instructions (Optional)</Label>
              <Textarea
                id="notes"
                value={customerInfo.notes}
                onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                placeholder="Any special requests..."
                rows={3}
              />
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={handlePlaceOrder}
                disabled={!customerInfo.name || !customerInfo.phone || cart.length === 0}
              >
                Place Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, specialInstructions?: string) => void;
}

function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleAddToCart = () => {
    onAddToCart(item, specialInstructions || undefined);
    setSpecialInstructions('');
    setShowDetails(false);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardContent className="p-0">
        {item.image_url && (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg">{item.name}</h3>
            <div className="flex gap-1">
              {item.is_featured && (
                <Badge variant="secondary">
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
              {item.dietary_info?.includes('vegetarian') && (
                <Badge variant="outline">
                  <Leaf className="w-3 h-3 mr-1" />
                  Vegetarian
                </Badge>
              )}
              {item.dietary_info?.includes('vegan') && (
                <Badge variant="outline">
                  <Leaf className="w-3 h-3 mr-1" />
                  Vegan
                </Badge>
              )}
              {item.dietary_info?.includes('spicy') && (
                <Badge variant="outline">
                  <Flame className="w-3 h-3 mr-1" />
                  Spicy
                </Badge>
              )}
            </div>
          </div>
          
          <p className="text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
          
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-xl">${item.price.toFixed(2)}</span>
            {item.preparation_time && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                {item.preparation_time} mins
              </div>
            )}
          </div>

          {item.allergens && item.allergens.length > 0 && (
            <p className="text-xs text-muted-foreground mb-4">
              Allergens: {item.allergens.join(', ')}
            </p>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => onAddToCart(item)} 
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Order
            </Button>
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="outline">Customize</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{item.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{item.description}</p>
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Special Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special requests..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">${item.price.toFixed(2)}</span>
                    <Button onClick={handleAddToCart}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Order
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}