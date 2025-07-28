import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, ShoppingCart, Star, Clock, Leaf, Flame, Heart, Sparkles, Moon, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Star as StarIcon } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  logo_url?: string;
  cover_image_url?: string;
  rating?: number;
  cuisines?: string[];
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
  category: string; // Added for frontend mapping
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  special_instructions?: string;
  addons?: string[];
  variant?: string;
}

export default function Order() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const location = useLocation();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([{ id: 'all', name: 'All Items', description: '', sort_order: -1 }]);
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
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Add favorites state and persist in localStorage
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    const savedFavs = localStorage.getItem('restaurant_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
  }, []);
  useEffect(() => {
    localStorage.setItem('restaurant_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (itemId: string) => {
    setFavorites(favs => favs.includes(itemId) ? favs.filter(id => id !== itemId) : [...favs, itemId]);
  };

  // Persist cart in localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('restaurant_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('restaurant_cart', JSON.stringify(cart));
  }, [cart]);

  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let timeout: any;
    setError('');
    setLoading(true);
    timeout = setTimeout(() => {
      setLoading(false);
      setError('Request timed out. Please try again.');
    }, 10000); // 10 seconds
    loadRestaurantData().finally(() => clearTimeout(timeout));
    return () => clearTimeout(timeout);
  // eslint-disable-next-line
  }, [restaurantId, location.search, retryCount]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      setError('');
      // Load restaurant info
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();
      console.log('Fetched restaurant:', restaurantData, 'Error:', restaurantError);
      if (restaurantError || !restaurantData) {
        setError('Restaurant not found.');
        setLoading(false);
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
      console.log('Fetched categories:', categoriesData, 'Error:', categoriesError);
      if (categoriesError) {
        setError('Failed to load categories.');
        setLoading(false);
        return;
      }
      setCategories([{ id: 'all', name: t('allItems'), description: '', sort_order: -1 }, ...(categoriesData || [])]);
      setSelectedCategory('all');
      // Load menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select(`*, menu_categories!inner(name)`)
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      console.log('Fetched menu items:', menuData, 'Error:', menuError);
      if (menuError) {
        setError('Failed to load menu items.');
        setLoading(false);
        return;
      } else if (!menuData || menuData.length === 0) {
        setError('No menu items found for this restaurant.');
        setMenuItems([]);
        setLoading(false);
        return;
      } else {
        setMenuItems(menuData.map(item => ({
          ...item,
          category: item.menu_categories?.name || 'Uncategorized',
        })));
      }
      setError('');
      setLoading(false);
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem, specialInstructions?: string, selectedAddons: string[] = [], selectedVariant: string = 'regular') => {
    const existingItem = cart.find(cartItem => 
      cartItem.id === item.id && 
      cartItem.special_instructions === specialInstructions &&
      cartItem.addons?.sort().join(',') === selectedAddons.sort().join(',') &&
      cartItem.variant === selectedVariant
    );

    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id && 
        cartItem.special_instructions === specialInstructions &&
        cartItem.addons?.sort().join(',') === selectedAddons.sort().join(',') &&
        cartItem.variant === selectedVariant
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        id: item.id,
        name: item.name,
        price: item.price, // Base price
        quantity: 1,
        special_instructions: specialInstructions,
        addons: selectedAddons,
        variant: selectedVariant,
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
    return cart.reduce((total, item) => {
      const basePrice = item.price;
      const addonTotal = item.addons?.reduce((sum, id) => {
        const addon = ADDONS.find(a => a.id === id);
        return sum + (addon ? addon.price : 0);
      }, 0) || 0;
      const variantPrice = VARIANTS.find(v => v.id === item.variant)?.price || 0;
      return total + (basePrice + addonTotal + variantPrice) * item.quantity;
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showTracking, setShowTracking] = useState(false);

  // After placing order, save to localStorage and show tracking
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
          total_amount: getFinalTotal(),
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
        unit_price: item.price, // Base price
        total_price: (item.price + (item.addons?.reduce((sum, id) => {
          const addon = ADDONS.find(a => a.id === id);
          return sum + (addon ? addon.price : 0);
        }, 0) || 0) + (VARIANTS.find(v => v.id === item.variant)?.price || 0)) * item.quantity,
        special_instructions: item.special_instructions || null,
        addons: item.addons || null,
        variant: item.variant || null,
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

      // After successful order:
      const orderSummary = {
        id: orderData.id,
        status: 'pending',
        placedAt: Date.now(),
        estReady: Date.now() + 25 * 60 * 1000, // 25 mins from now
        customer: customerInfo.name,
        total: getFinalTotal(),
        restaurant: restaurant.name,
      };
      setLastOrder(orderSummary);
      localStorage.setItem('last_order', JSON.stringify(orderSummary));
      setShowTracking(true);
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Coupon state
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [discount, setDiscount] = useState(0);

  // Hardcoded coupons
  const COUPONS = [
    { code: 'SAVE10', type: 'percent', value: 10, min: 0 },
    { code: 'FLAT50', type: 'flat', value: 50, min: 200 },
  ];

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = coupon.trim().toUpperCase();
    const found = COUPONS.find(c => c.code === code);
    if (!found) {
      setCouponError('Invalid coupon code.');
      setAppliedCoupon(null);
      setDiscount(0);
      return;
    }
    if (getCartTotal() < found.min) {
      setCouponError(`Minimum order $${found.min} required for this coupon.`);
      setAppliedCoupon(null);
      setDiscount(0);
      return;
    }
    setAppliedCoupon(found.code);
    let d = 0;
    if (found.type === 'percent') d = getCartTotal() * (found.value / 100);
    if (found.type === 'flat') d = found.value;
    setDiscount(d);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCoupon('');
    setCouponError('');
  };

  const getFinalTotal = () => Math.max(0, getCartTotal() - discount);

  // On mount, load last order from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('last_order');
    if (saved) setLastOrder(JSON.parse(saved));
  }, []);

  // Order tracking status logic
  const getOrderStatus = (order: any) => {
    if (!order) return 'pending';
    const now = Date.now();
    if (now < order.placedAt + 5 * 60 * 1000) return 'pending'; // 0-5 min
    if (now < order.placedAt + 20 * 60 * 1000) return 'preparing'; // 5-20 min
    if (now < order.estReady) return 'ready'; // 20-25 min
    return 'completed';
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready for Pickup/Delivery';
      case 'completed': return 'Completed';
      default: return status;
    }
  };
  const getProgress = (order: any) => {
    if (!order) return 0;
    const now = Date.now();
    const total = order.estReady - order.placedAt;
    const elapsed = Math.min(now - order.placedAt, total);
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };
  const getEta = (order: any) => {
    if (!order) return '';
    const mins = Math.max(0, Math.round((order.estReady - Date.now()) / 60000));
    return mins > 0 ? `${mins} min${mins > 1 ? 's' : ''}` : 'Ready!';
  };

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dark_mode') === 'true';
    }
    return false;
  });
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dark_mode', 'false');
    }
  }, [darkMode]);

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ];
  const I18N = {
    en: {
      allItems: 'All Items',
      favorites: 'Favorites',
      menuCategories: 'Menu Categories',
      addToOrder: 'Add to Order',
      customize: 'Customize',
      cart: 'Cart',
      items: 'items',
      checkout: 'Checkout',
      yourOrder: 'Your Order',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      coupon: 'Coupon',
      apply: 'Apply',
      remove: 'Remove',
      placeOrder: 'Place Order',
      name: 'Name',
      phone: 'Phone',
      email: 'Email (Optional)',
      tableNumber: 'Table Number (Optional)',
      notes: 'Special Instructions (Optional)',
      orderPlaced: 'Order Placed!',
      orderTracking: 'Order Tracking',
      status: 'Status',
      eta: 'ETA',
      close: 'Close',
      searchPlaceholder: 'Search menu items...',
      emptyCart: 'Your cart is empty. Add some delicious items!',
      noFavorites: 'No favorites yet. Tap the heart on any dish to add it here!',
      noSearchResults: 'No menu items match your search.',
      ratingsReviews: 'Ratings & Reviews',
      submitReview: 'Submit Review',
      noReviews: 'No reviews yet. Be the first to review!',
      darkMode: 'Dark Mode',
      language: 'Language',
    },
    es: {
      allItems: 'Todos los platos',
      favorites: 'Favoritos',
      menuCategories: 'Categorías',
      addToOrder: 'Añadir al pedido',
      customize: 'Personalizar',
      cart: 'Carrito',
      items: 'artículos',
      checkout: 'Pagar',
      yourOrder: 'Tu pedido',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Descuento',
      coupon: 'Cupón',
      apply: 'Aplicar',
      remove: 'Eliminar',
      placeOrder: 'Realizar pedido',
      name: 'Nombre',
      phone: 'Teléfono',
      email: 'Correo (opcional)',
      tableNumber: 'Mesa (opcional)',
      notes: 'Instrucciones especiales (opcional)',
      orderPlaced: '¡Pedido realizado!',
      orderTracking: 'Seguimiento de pedido',
      status: 'Estado',
      eta: 'Tiempo estimado',
      close: 'Cerrar',
      searchPlaceholder: 'Buscar en el menú...',
      emptyCart: 'Tu carrito está vacío. ¡Agrega algo delicioso!',
      noFavorites: 'Aún no hay favoritos. ¡Toca el corazón para añadir!',
      noSearchResults: 'Ningún plato coincide con tu búsqueda.',
      ratingsReviews: 'Valoraciones y reseñas',
      submitReview: 'Enviar reseña',
      noReviews: 'Aún no hay reseñas. ¡Sé el primero!',
      darkMode: 'Modo oscuro',
      language: 'Idioma',
    },
  };
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = (key: keyof typeof I18N['en']) => I18N[lang][key] || key;
  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [showOrders, setShowOrders] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  // Demo: Save user in localStorage
  const handleAuth = () => {
    setAuthError('');
    if (!authEmail || !authPassword || (authMode === 'register' && !authName)) {
      setAuthError('Please fill all fields.');
      return;
    }
    if (authMode === 'register') {
      setUser({ email: authEmail, name: authName });
      localStorage.setItem('user', JSON.stringify({ email: authEmail, name: authName }));
      setShowAuth(false);
    } else {
      // For demo, just check email/password match
      const saved = localStorage.getItem('user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.email === authEmail) {
          setUser(u);
          setShowAuth(false);
        } else {
          setAuthError('User not found.');
        }
      } else {
        setAuthError('User not found.');
      }
    }
  };
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  // Fetch order history for user (from localStorage for demo)
  useEffect(() => {
    if (user) {
      const allOrders = JSON.parse(localStorage.getItem('order_history') || '[]');
      setOrderHistory(allOrders.filter((o: any) => o.email === user.email));
    }
  }, [user, showOrders]);
  // Save each new order to order_history
  const saveOrderToHistory = (order: any) => {
    const allOrders = JSON.parse(localStorage.getItem('order_history') || '[]');
    allOrders.unshift(order);
    localStorage.setItem('order_history', JSON.stringify(allOrders));
  };
  // After placing order, save to history
  useEffect(() => {
    if (lastOrder) {
      saveOrderToHistory({ ...lastOrder, email: user?.email || customerInfo.email || 'guest', items: cart });
    }
  }, [lastOrder, user, customerInfo.email, cart]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading menu...</p>
          {error && (
            <div className="mt-6 text-red-500 animate-fade-in">
              <p>{error}</p>
              <Button className="mt-2" onClick={() => setRetryCount(c => c + 1)}>Retry</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Error</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => setRetryCount(c => c + 1)}>Retry</Button>
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

  // Add a 'Favorites' tab/button to categories
  const categoriesWithFav = [
    { id: 'favorites', name: 'Favorites', description: '', sort_order: -2 },
    ...categories
  ];

  const [search, setSearch] = useState('');

  // Update itemsToShow logic to support search
  const filteredByCategory = selectedCategory === 'all'
    ? menuItems
    : selectedCategory === 'favorites'
      ? menuItems.filter(item => favorites.includes(item.id))
      : menuItems.filter(item => item.category_id === selectedCategory);
  const itemsToShow = search.trim()
    ? filteredByCategory.filter(item =>
        item.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        item.description.toLowerCase().includes(search.trim().toLowerCase())
      )
    : filteredByCategory;

  return (
    <div className="min-h-screen bg-gradient-subtle dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Restaurant Header */}
        <div className="relative mb-8 rounded-2xl overflow-hidden shadow-lg">
          <div className="h-48 md:h-64 w-full bg-gradient-to-r from-orange-100 to-pink-100 flex items-end justify-center">
            {restaurant.cover_image_url ? (
              <img src={restaurant.cover_image_url} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-70" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="relative z-10 flex flex-col items-center w-full pb-6">
              <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center mb-2 overflow-hidden border-4 border-white">
                {restaurant.logo_url ? (
                  <img src={restaurant.logo_url} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🍽️</span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow mb-1">{restaurant.name}</h1>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-bold">{restaurant.rating || '4.5'} ★</span>
                <span className="text-white text-xs">{restaurant.cuisines?.join(', ') || 'Multi-cuisine'}</span>
              </div>
              <p className="text-white text-sm opacity-90 mb-1">{restaurant.description}</p>
              <p className="text-white text-xs opacity-80">{restaurant.address}</p>
            </div>
          </div>
        </div>

        {tableNumber && (
          <div className="mb-4">
            <Badge variant="outline">Table: {tableNumber}</Badge>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Menu Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-0">
                <div className="flex lg:flex-col gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-orange-200 px-2">
                  {categoriesWithFav.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'ghost'}
                      className="min-w-[120px] flex-shrink-0 justify-start"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                      {category.id === 'favorites' && (
                        <Heart className="w-4 h-4 ml-1 text-pink-500" fill={selectedCategory === 'favorites' ? 'currentColor' : 'none'} />
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cart Summary */}
            {cart.length > 0 ? (
              <div className="sticky top-24 z-20 lg:static lg:top-auto lg:z-auto md:static md:top-auto md:z-auto">
                <Card className="mt-4 shadow-xl border-2 border-orange-100 animate-fade-in dark:bg-gray-900 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Your Order</span>
                      <Badge variant="secondary">{getCartItemCount()} items</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {cart.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="flex justify-between items-center group">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            {item.special_instructions && (
                              <p className="text-xs text-muted-foreground">
                                Note: {item.special_instructions}
                              </p>
                            )}
                            {item.addons && item.addons.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Addons: {item.addons.join(', ')}
                              </p>
                            )}
                            {item.variant && (
                              <p className="text-xs text-muted-foreground">
                                Variant: {item.variant}
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
                                if (menuItem) addToCart(menuItem, item.special_instructions, item.addons || [], item.variant || 'regular');
                              }}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setCart(cart.filter((c, i) => i !== index))}
                              title="Remove"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center font-bold">
                        <span>Subtotal:</span>
                        <span>${getCartTotal().toFixed(2)}</span>
                      </div>
                      {/* Coupon input */}
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between mt-2 animate-fade-in">
                          <span className="text-green-600 font-semibold">Coupon {appliedCoupon} applied!</span>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={handleRemoveCoupon}>Remove</Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-2 animate-fade-in">
                          <Input
                            value={coupon}
                            onChange={e => setCoupon(e.target.value)}
                            placeholder="Promo code"
                            className="flex-1"
                            size={10}
                          />
                          <Button size="sm" onClick={handleApplyCoupon}>Apply</Button>
                        </div>
                      )}
                      {couponError && <p className="text-xs text-red-500 mt-1 animate-fade-in">{couponError}</p>}
                      {/* Discount */}
                      {discount > 0 && (
                        <div className="flex justify-between items-center text-green-600 font-semibold mt-2 animate-fade-in">
                          <span>Discount:</span>
                          <span>- ${discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center font-bold text-lg mt-2">
                        <span>Total:</span>
                        <span>${getFinalTotal().toFixed(2)}</span>
                      </div>
                      <Button 
                        className="w-full mt-4 bg-gradient-to-r from-orange-400 to-pink-400 text-white font-bold shadow-lg hover:from-orange-500 hover:to-pink-500"
                        onClick={() => setShowCheckout(true)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Checkout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {/* On mobile, show a floating cart summary at the bottom */}
                <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden md:hidden">
                  <div className="bg-gradient-to-r from-orange-400 to-pink-400 text-white flex items-center justify-between px-4 py-3 shadow-xl rounded-t-2xl">
                    <span className="font-bold">Cart: {getCartItemCount()} items</span>
                    <span className="font-bold">${getFinalTotal().toFixed(2)}</span>
                    <Button size="sm" className="ml-2 bg-white/80 text-orange-600 font-bold" onClick={() => setShowCheckout(true)}>
                      Checkout
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center text-muted-foreground animate-fade-in">
                <Card className="p-6">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                  <p>Your cart is empty. Add some delicious items!</p>
                </Card>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center gap-2">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search menu items..."
                className="max-w-md"
              />
              {search && (
                <Button size="sm" variant="ghost" onClick={() => setSearch('')}>Clear</Button>
              )}
            </div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold">
                {categories.find(cat => cat.id === selectedCategory)?.name || 'Menu Items'}
              </h2>
              <p className="text-muted-foreground">
                {categories.find(cat => cat.id === selectedCategory)?.description}
              </p>
            </div>

            {selectedCategory === 'favorites' && itemsToShow.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No favorites yet. Tap the heart on any dish to add it here!</p>
              </div>
            )}
            {itemsToShow.length === 0 && search && (
              <div className="text-center py-12 animate-fade-in">
                <p className="text-muted-foreground">No menu items match your search.</p>
              </div>
            )}
            {itemsToShow.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No items available in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {itemsToShow.map((item) => (
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
                <span>Subtotal:</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between mt-2 animate-fade-in">
                  <span className="text-green-600 font-semibold">Coupon {appliedCoupon} applied!</span>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={handleRemoveCoupon}>Remove</Button>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between items-center text-green-600 font-semibold mt-2 animate-fade-in">
                  <span>Discount:</span>
                  <span>- ${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-bold text-lg mt-2">
                <span>Total:</span>
                <span>${getFinalTotal().toFixed(2)}</span>
              </div>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-orange-400 to-pink-400 text-white font-bold shadow-lg hover:from-orange-500 hover:to-pink-500"
                onClick={async () => {
                  setPlacingOrder(true);
                  await handlePlaceOrder();
                  setPlacingOrder(false);
                }}
                disabled={!customerInfo.name || !customerInfo.phone || cart.length === 0 || placingOrder}
              >
                {placingOrder ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {lastOrder && (
        <Dialog open={showTracking} onOpenChange={setShowTracking}>
          <DialogContent className="max-w-md animate-fade-in">
            <DialogHeader>
              <DialogTitle>Order Tracking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-bold">Order #</span>
                <span className="text-orange-600 font-mono">{lastOrder.id.slice(-8)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Status:</span>
                <span className="text-green-700 font-semibold animate-pulse">{getStatusLabel(getOrderStatus(lastOrder))}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">ETA:</span>
                <span className="text-blue-600 font-semibold">{getEta(lastOrder)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-orange-400 to-pink-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getProgress(lastOrder)}%` }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Total:</span>
                <span className="text-lg font-bold">${lastOrder.total.toFixed(2)}</span>
              </div>
              <Button className="w-full mt-2" onClick={() => setShowTracking(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Add dark mode toggle button (top right on desktop, floating on mobile) */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 items-center">
        <Button
          variant="ghost"
          className="rounded-full p-2 shadow-lg bg-white/80 dark:bg-black/80 backdrop-blur"
          onClick={() => setDarkMode(d => !d)}
          aria-label={t('darkMode')}
        >
          {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
        </Button>
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          className="rounded-full p-2 bg-white/80 dark:bg-black/80 shadow-lg border border-gray-200 dark:border-gray-700 text-sm"
          aria-label={t('language')}
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      {/* Add login/register modal */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="max-w-xs animate-fade-in">
          <DialogHeader>
            <DialogTitle>{authMode === 'login' ? 'Login' : 'Register'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {authMode === 'register' && (
              <div>
                <Label>Name</Label>
                <Input value={authName} onChange={e => setAuthName(e.target.value)} />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input value={authEmail} onChange={e => setAuthEmail(e.target.value)} type="email" />
            </div>
            <div>
              <Label>Password</Label>
              <Input value={authPassword} onChange={e => setAuthPassword(e.target.value)} type="password" />
            </div>
            {authError && <p className="text-xs text-red-500">{authError}</p>}
            <Button className="w-full" onClick={handleAuth}>{authMode === 'login' ? 'Login' : 'Register'}</Button>
            <Button variant="ghost" className="w-full" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Add order history modal */}
      <Dialog open={showOrders} onOpenChange={setShowOrders}>
        <DialogContent className="max-w-lg animate-fade-in">
          <DialogHeader>
            <DialogTitle>My Orders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {orderHistory.length === 0 ? (
              <p className="text-muted-foreground">No orders yet.</p>
            ) : orderHistory.map((order, i) => (
              <div key={i} className="bg-orange-50 dark:bg-gray-800 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">Order #</span>
                  <span className="text-orange-600 font-mono">{order.id.slice(-8)}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{new Date(order.placedAt).toLocaleString()}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-sm mb-1">
                  {order.items.map((item: any, idx: number) => (
                    <span key={idx} className="bg-white/80 dark:bg-gray-900 px-2 py-1 rounded shadow border border-orange-100 dark:border-gray-700">{item.name} x{item.quantity}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">Total:</span>
                  <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{order.status || 'Completed'}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, specialInstructions?: string, selectedAddons?: string[], selectedVariant?: string) => void;
}

function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  // Badge logic
  const isNew = (() => {
    if (!item.created_at) return false;
    const created = new Date(item.created_at);
    const now = new Date();
    const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  })();

  // Add-ons and variants (hardcoded for demo)
  const ADDONS = [
    { id: 'cheese', name: 'Extra Cheese', price: 1.5 },
    { id: 'fries', name: 'Fries', price: 2 },
    { id: 'drink', name: 'Soft Drink', price: 2.5 },
  ];
  const VARIANTS = [
    { id: 'regular', name: 'Regular', price: 0 },
    { id: 'large', name: 'Large', price: 3 },
    { id: 'spicy', name: 'Spicy', price: 0 },
    { id: 'mild', name: 'Mild', price: 0 },
  ];

  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('regular');

  // Calculate price with add-ons/variant
  const basePrice = item.price;
  const addonTotal = selectedAddons.reduce((sum, id) => {
    const addon = ADDONS.find(a => a.id === id);
    return sum + (addon ? addon.price : 0);
  }, 0);
  const variantPrice = VARIANTS.find(v => v.id === selectedVariant)?.price || 0;
  const finalPrice = basePrice + addonTotal + variantPrice;

  // Ratings/Reviews
  const [reviews, setReviews] = useState(DEMO_REVIEWS[item.id] || []);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Calculate average rating
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 5;

  const handleAddToCart = () => {
    onAddToCart(
      item,
      specialInstructions || undefined,
      selectedAddons,
      selectedVariant
    );
    setSpecialInstructions('');
    setSelectedAddons([]);
    setSelectedVariant('regular');
    setShowDetails(false);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 relative dark:bg-gray-900 dark:border-gray-700">
      <CardContent className="p-0 dark:bg-gray-900">
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
            <h3 className="font-bold text-lg flex items-center gap-2">
              {item.name}
              <span className="flex items-center gap-1 text-yellow-500 text-sm font-semibold">
                <StarIcon className="w-4 h-4" />
                {avgRating.toFixed(1)}
                <span className="text-xs text-muted-foreground ml-1">({reviews.length})</span>
              </span>
            </h3>
            <div className="flex gap-1 items-center">
              {item.is_featured && (
                <Badge variant="secondary" className="animate-fade-in flex items-center gap-1">
                  <Star className="w-3 h-3 mr-1 text-yellow-500" />
                  Bestseller
                </Badge>
              )}
              {item.dietary_info?.includes('vegetarian') && (
                <Badge variant="outline" className="animate-fade-in flex items-center gap-1">
                  <Leaf className="w-3 h-3 mr-1 text-green-600" />
                  Veg
                </Badge>
              )}
              {item.dietary_info?.includes('vegan') && (
                <Badge variant="outline" className="animate-fade-in flex items-center gap-1">
                  <Leaf className="w-3 h-3 mr-1 text-lime-600" />
                  Vegan
                </Badge>
              )}
              {item.dietary_info?.includes('spicy') && (
                <Badge variant="outline" className="animate-fade-in flex items-center gap-1">
                  <Flame className="w-3 h-3 mr-1 text-red-500" />
                  Spicy
                </Badge>
              )}
              {isNew && (
                <Badge variant="outline" className="animate-fade-in flex items-center gap-1 border-pink-400 text-pink-500">
                  <Sparkles className="w-3 h-3 mr-1 text-pink-400" />
                  New
                </Badge>
              )}
              <button
                onClick={() => toggleFavorite(item.id)}
                className="ml-2 focus:outline-none"
                aria-label={favorites.includes(item.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={`w-5 h-5 transition-all duration-200 ${favorites.includes(item.id) ? 'text-pink-500 scale-110' : 'text-gray-300 hover:text-pink-400'}`}
                  fill={favorites.includes(item.id) ? 'currentColor' : 'none'}
                />
              </button>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
          
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-xl">${finalPrice.toFixed(2)}</span>
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
                  {/* Add-ons */}
                  <div>
                    <Label>Add-ons</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ADDONS.map(addon => (
                        <label key={addon.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAddons.includes(addon.id)}
                            onChange={e => setSelectedAddons(val => e.target.checked ? [...val, addon.id] : val.filter(id => id !== addon.id))}
                          />
                          <span>{addon.name} (+${addon.price})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Variants */}
                  <div>
                    <Label>Variant</Label>
                    <div className="flex gap-4 mt-2">
                      {VARIANTS.map(variant => (
                        <label key={variant.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`variant-${item.id}`}
                            checked={selectedVariant === variant.id}
                            onChange={() => setSelectedVariant(variant.id)}
                          />
                          <span>{variant.name}{variant.price > 0 ? ` (+$${variant.price})` : ''}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Special Instructions */}
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
                  {/* Ratings/Reviews Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <StarIcon className="w-5 h-5 text-yellow-500" />
                      Ratings & Reviews
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={`focus:outline-none ${reviewRating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                        >
                          <StarIcon className="w-5 h-5" fill={reviewRating >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                      <span className="ml-2 text-sm">{reviewRating} / 5</span>
                    </div>
                    <Textarea
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="Write your review..."
                      rows={2}
                      className="mb-2"
                    />
                    <Button
                      size="sm"
                      disabled={submittingReview || !reviewText.trim()}
                      onClick={async () => {
                        setSubmittingReview(true);
                        setTimeout(() => {
                          setReviews(r => [{
                            rating: reviewRating,
                            text: reviewText,
                            user: 'Guest',
                            date: new Date().toLocaleDateString(),
                          }, ...r]);
                          setReviewText('');
                          setReviewRating(5);
                          setSubmittingReview(false);
                        }, 600);
                      }}
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                    <div className="mt-4 space-y-2 max-h-40 overflow-y-auto animate-fade-in">
                      {reviews.length === 0 && (
                        <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                      )}
                      {reviews.map((r, i) => (
                        <div key={i} className="bg-orange-50 rounded p-2 flex flex-col gap-1">
                          <span className="flex items-center gap-1 text-yellow-500">
                            {[...Array(r.rating)].map((_, idx) => <StarIcon key={idx} className="w-3 h-3" fill="currentColor" />)}
                            <span className="text-xs text-muted-foreground ml-2">{r.user} • {r.date}</span>
                          </span>
                          <span className="text-sm">{r.text}</span>
                        </div>
                      ))}
                    </div>
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