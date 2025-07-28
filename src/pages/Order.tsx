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
import { Plus, Minus, ShoppingCart, Star, Clock, Leaf, Flame, Heart, Sparkles, Moon, Sun, X } from 'lucide-react';
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
  category: string;
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
  
  // Extract table number from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const tableNumberFromUrl = urlParams.get('table');
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([{ id: 'all', name: 'All Items', description: '', sort_order: -1 }]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [search, setSearch] = useState('');
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
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
  const [reviews, setReviews] = useState<{[key: string]: any[]}>({});
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    tableNumber: tableNumberFromUrl || '',
    notes: '',
  });
  const [tableNumber, setTableNumber] = useState<string | null>(tableNumberFromUrl);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Order tracking state
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showTracking, setShowTracking] = useState(false);

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

  // Dark mode state
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

  // Menu item customization data
  const ADDONS = [
    { id: 'cheese', name: 'Extra Cheese', price: 1.5 },
    { id: 'fries', name: 'French Fries', price: 2.0 },
    { id: 'drink', name: 'Soft Drink', price: 2.5 },
    { id: 'sauce', name: 'Extra Sauce', price: 0.5 },
    { id: 'bacon', name: 'Bacon', price: 3.0 },
  ];

  const VARIANTS = [
    { id: 'regular', name: 'Regular', price: 0 },
    { id: 'large', name: 'Large', price: 3.0 },
    { id: 'spicy', name: 'Spicy', price: 0 },
    { id: 'mild', name: 'Mild', price: 0 },
  ];

  // Multi-language support
  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ];
  const I18N = {
    en: {
      allItems: 'All Items',
      favorites: 'Favorites',
      searchPlaceholder: 'Search menu items...',
      addToCart: 'Add to Cart',
      checkout: 'Checkout',
      total: 'Total',
      placeOrder: 'Place Order',
      name: 'Name',
      phone: 'Phone',
      email: 'Email (Optional)',
      notes: 'Special Instructions',
      darkMode: 'Dark Mode',
      language: 'Language',
      cart: 'Cart',
    },
    es: {
      allItems: 'Todos los platos',
      favorites: 'Favoritos',
      searchPlaceholder: 'Buscar en el menú...',
      addToCart: 'Añadir al carrito',
      checkout: 'Pagar',
      total: 'Total',
      placeOrder: 'Realizar pedido',
      name: 'Nombre',
      phone: 'Teléfono',
      email: 'Correo (opcional)',
      notes: 'Instrucciones especiales',
      darkMode: 'Modo oscuro',
      language: 'Idioma',
      cart: 'Carrito',
    },
  };
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = (key: keyof typeof I18N['en']) => I18N[lang][key] || key;
  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);

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

  const openItemDetails = (item: MenuItem) => {
    setSelectedItem(item);
    setShowItemDetails(true);
  };

  // Authentication functions
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

  // Get table number from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const table = params.get('table');
    if (table) {
      setTableNumber(table);
      setCustomerInfo(prev => ({ ...prev, tableNumber: table }));
    }
  }, [location]);

  // Handle clicking outside cart popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showCartPopup && !target.closest('.cart-popup') && !target.closest('.cart-button')) {
        setShowCartPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCartPopup]);

  const loadRestaurantData = async () => {
    if (!restaurantId) {
      setError('Restaurant ID is required');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading restaurant data for:', restaurantId);
      setLoading(true);
      setError(null);

      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) {
        console.error('Restaurant fetch error:', restaurantError);
        setError('Restaurant not found');
        setLoading(false);
        return;
      }

      if (!restaurantData) {
        setError('Restaurant not found');
        setLoading(false);
        return;
      }

      console.log('Fetched restaurant:', restaurantData);
      setRestaurant(restaurantData);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order');

      if (categoriesError) {
        console.error('Categories fetch error:', categoriesError);
        setError('Failed to load categories');
        setLoading(false);
        return;
      }

      console.log('Fetched categories:', categoriesData);
      setCategories(prev => [...prev, ...(categoriesData || [])]);

      // Fetch menu items with category names
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories!inner(name)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('created_at');

      if (menuItemsError) {
        console.error('Menu items fetch error:', menuItemsError);
        setError('Failed to load menu items');
        setLoading(false);
        return;
      }

      console.log('Fetched menu items:', menuItemsData);
      
      // Map the data to include category names
      const mappedMenuItems = (menuItemsData || []).map(item => ({
        ...item,
        category: item.menu_categories?.name || 'Uncategorized'
      }));

      setMenuItems(mappedMenuItems);
      setLoading(false);

    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurantData();
  }, [restaurantId]);

  const addToCart = (item: MenuItem, specialInstructions?: string, selectedAddons: string[] = [], selectedVariant: string = 'regular') => {
    const cartItemId = `${item.id}-${specialInstructions || 'default'}-${selectedAddons.join('-')}-${selectedVariant}`;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === cartItemId);
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === cartItemId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          name: item.name,
          price: item.price,
          quantity: 1,
          special_instructions: specialInstructions,
          addons: selectedAddons,
          variant: selectedVariant,
        };
        return [...prevCart, newItem];
      }
    });

    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  const removeFromCart = (cartItemId: string, specialInstructions?: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== cartItemId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (!restaurant) {
      toast({
        title: "Error",
        description: "Restaurant information not found",
        variant: "destructive",
      });
      return;
    }

    setPlacingOrder(true);

    try {
      // Auto-generate customer info based on table number
      const customerName = tableNumber ? `Table ${tableNumber} Guest` : 'Guest';
      const customerPhone = tableNumber ? `Table-${tableNumber}` : 'N/A';
      
      const orderData = {
        restaurant_id: restaurant.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerInfo.email || 'guest@restaurant.com',
        table_number: tableNumber || customerInfo.tableNumber || 'Unknown',
        notes: customerInfo.notes,
        total_amount: getFinalTotal(),
        status: 'pending',
        order_items: cart.map(item => ({
          menu_item_id: item.id.split('-')[0], // Extract original menu item ID
          quantity: item.quantity,
          price: item.price,
          special_instructions: item.special_instructions,
          addons: item.addons,
          variant: item.variant,
        })),
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('Order creation error:', error);
        toast({
          title: "Order failed",
          description: "Failed to place order. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Order placed successfully!",
        description: `Your order #${data.id.slice(-8)} has been placed. We'll bring it to your table when ready.`,
      });

      // Clear cart
      setCart([]);
      setShowCheckout(false);
      setCustomerInfo({
        name: '',
        phone: '',
        email: '',
        tableNumber: tableNumber || '',
        notes: '',
      });

      // Save order to history
      const orderSummary = {
        id: data.id,
        status: 'pending',
        placedAt: Date.now(),
        estReady: Date.now() + 25 * 60 * 1000, // 25 mins from now
        customer: customerName,
        total: getFinalTotal(),
        restaurant: restaurant.name,
        items: cart,
        email: user?.email || customerInfo.email || 'guest',
        tableNumber: tableNumber || 'Unknown',
      };
      saveOrderToHistory(orderSummary);

    } catch (error) {
      console.error('Order error:', error);
      toast({
        title: "Order failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  // Filter items based on selected category and search
  const itemsToShow = menuItems.filter(item => {
    const categoryMatch = selectedCategory === 'all' || selectedCategory === 'favorites' 
      ? (selectedCategory === 'all' ? true : favorites.includes(item.id))
      : item.category === selectedCategory;
    const searchMatch = !search.trim() || 
      item.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      item.description.toLowerCase().includes(search.trim().toLowerCase());
    return categoryMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadRestaurantData} className="bg-orange-500 hover:bg-orange-600">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Restaurant not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Back Button */}
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-full hover:bg-orange-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Center - Search Input */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Right - Cart Icon with Badge */}
            <div className="relative flex items-center gap-2">
              {/* User Profile / Login */}
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOrders(true)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Order History"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    <button
                      onClick={handleLogout}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                      title="Logout"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Login"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              )}
              
              {/* Cart Icon */}
              <button
                onClick={() => setShowCartPopup(!showCartPopup)}
                className="cart-button p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {getCartItemCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Header */}
      <div className="relative h-80 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 mt-16">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        <div className="relative z-10 h-full flex items-center justify-center text-white">
          <div className="text-center max-w-2xl px-4">
            <div className="mb-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl">🍽️</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">{restaurant.name}</h1>
            <p className="text-lg md:text-xl opacity-95 mb-2 drop-shadow-md">{restaurant.description}</p>
            {restaurant.address && (
              <p className="text-sm opacity-80 drop-shadow-sm flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {restaurant.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dark Mode Toggle and Language Selector */}
      <div className="fixed top-20 right-4 z-40 flex flex-col gap-2">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-full p-2 bg-white/90 backdrop-blur border border-orange-200 shadow-lg hover:scale-110 transition-all duration-300"
        >
          {darkMode ? <Sun className="w-5 h-5 text-orange-600" /> : <Moon className="w-5 h-5 text-orange-600" />}
        </button>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as 'en' | 'es')}
          className="rounded-full p-2 bg-white/90 shadow-lg border border-orange-200 text-sm backdrop-blur"
        >
          <option value="en">🇺🇸 EN</option>
          <option value="es">🇪🇸 ES</option>
        </select>
      </div>

      {/* Category Navigation */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.name)}
            className={`px-6 py-3 rounded-full whitespace-nowrap transition-all duration-200 font-medium ${
              selectedCategory === category.name
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white text-gray-700 hover:bg-orange-50 border border-orange-200'
            }`}
          >
            {category.name}
          </button>
        ))}
        <button
          onClick={() => setSelectedCategory('favorites')}
          className={`px-6 py-3 rounded-full whitespace-nowrap transition-all duration-200 font-medium flex items-center gap-2 ${
            selectedCategory === 'favorites'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-white text-gray-700 hover:bg-orange-50 border border-orange-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          Favorites
        </button>
      </div>

        {/* Menu Items Grid */}
        <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {itemsToShow.map((item) => (
            <Card key={item.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-lg hover:-translate-y-1">
              <CardHeader className="p-0">
                <div className="relative h-48 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                      <span className="text-6xl">🍽️</span>
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${
                      favorites.includes(item.id)
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-white/90 text-gray-400 hover:text-red-500 backdrop-blur'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1">
                    {item.is_featured && (
                      <Badge className="bg-yellow-500 text-white border-0 shadow-sm">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Bestseller
                      </Badge>
                    )}
                    {item.dietary_info?.includes('vegetarian') && (
                      <Badge className="bg-green-500 text-white border-0 shadow-sm">
                        <Leaf className="w-3 h-3 mr-1" />
                        Veg
                      </Badge>
                    )}
                    {item.dietary_info?.includes('spicy') && (
                      <Badge className="bg-red-500 text-white border-0 shadow-sm">
                        <Flame className="w-3 h-3 mr-1" />
                        Spicy
                      </Badge>
                    )}
                    {item.created_at && (() => {
                      const created = new Date(item.created_at);
                      const now = new Date();
                      const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                      return diff <= 7;
                    })() && (
                      <Badge className="bg-pink-500 text-white border-0 shadow-sm">
                        <Sparkles className="w-3 h-3 mr-1" />
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                  <span className="font-bold text-xl text-orange-600">${item.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`w-4 h-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">(4.2 • 12 reviews)</span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => addToCart(item)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addToCart')}
                  </Button>
                  <Button
                    onClick={() => openItemDetails(item)}
                    variant="outline"
                    className="px-3 py-3 border-orange-300 hover:bg-orange-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {itemsToShow.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No items found</h3>
            <p className="text-gray-500">No menu items available in this category.</p>
          </div>
        )}

        {/* Cart Summary - Fixed Bottom on Mobile */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-orange-200 shadow-2xl md:hidden">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-lg">Total: ${getFinalTotal().toFixed(2)}</span>
                <span className="text-sm text-gray-500">{getCartItemCount()} items</span>
              </div>
              <Button
                onClick={() => setShowCheckout(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg shadow-lg"
              >
                {t('checkout')}
              </Button>
            </div>
          </div>
        )}

        {/* Cart Summary - Sidebar on Desktop */}
        {cart.length > 0 && (
          <div className="cart-popup hidden md:block fixed top-20 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-orange-200 max-h-96 overflow-y-auto animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Your Order</h3>
                <button
                  onClick={() => setShowCartPopup(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="border-t border-orange-200 pt-4 mb-4">
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={!coupon.trim()}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Apply
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <span className="text-sm text-green-700">Coupon applied: {appliedCoupon.code}</span>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-green-700 hover:text-green-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-sm text-red-500">{couponError}</p>
                )}
              </div>

              <div className="border-t border-orange-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-xl text-orange-600">${getFinalTotal().toFixed(2)}</span>
                </div>
                <Button
                  onClick={() => {
                    setShowCartPopup(false);
                    setShowCheckout(true);
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg shadow-lg"
                >
                  {t('checkout')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Your Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Table Number Display */}
              {tableNumber && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">📍</span>
                    <span className="font-medium text-blue-800">
                      Table {tableNumber}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Your order will be delivered to your table
                  </p>
                </div>
              )}

              {/* Order Summary */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="flex-1">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <Label htmlFor="notes">Special Instructions (Optional)</Label>
                <Textarea
                  id="notes"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special requests or dietary requirements..."
                  rows={3}
                />
              </div>

              {/* Total and Place Order */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-xl text-orange-600">${getFinalTotal().toFixed(2)}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Discount Applied:</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                
                <Button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg shadow-lg"
                >
                  {placingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Placing Order...
                    </>
                  ) : (
                    `Place Order - $${getFinalTotal().toFixed(2)}`
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Item Details Modal */}
        <Dialog open={showItemDetails} onOpenChange={setShowItemDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedItem?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">{selectedItem?.description}</p>
              
              {/* Add-ons */}
              <div>
                <h4 className="font-semibold mb-2">Add-ons</h4>
                <div className="space-y-2">
                  {ADDONS.map((addon) => (
                    <label key={addon.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddons([...selectedAddons, addon.name]);
                            } else {
                              setSelectedAddons(selectedAddons.filter(a => a !== addon.name));
                            }
                          }}
                        />
                        <span>{addon.name}</span>
                      </div>
                      <span className="text-orange-600 font-semibold">+${addon.price.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div>
                <h4 className="font-semibold mb-2">Size & Style</h4>
                <div className="space-y-2">
                  {VARIANTS.map((variant) => (
                    <label key={variant.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="variant"
                          value={variant.name}
                          checked={selectedVariant === variant.name}
                          onChange={(e) => setSelectedVariant(e.target.value)}
                          className="rounded"
                        />
                        <span>{variant.name}</span>
                      </div>
                      <span className="text-orange-600 font-semibold">+${variant.price.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => {
                  if (selectedItem) {
                    addToCart(selectedItem, '', selectedAddons, selectedVariant);
                    setShowItemDetails(false);
                    setSelectedAddons([]);
                    setSelectedVariant('regular');
                  }
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
              >
                Add to Cart - ${selectedItem ? (selectedItem.price + 
                  selectedAddons.reduce((sum, addon) => sum + ADDONS.find(a => a.name === addon)?.price || 0, 0) +
                  (selectedVariant !== 'regular' ? VARIANTS.find(v => v.name === selectedVariant)?.price || 0 : 0)
                ).toFixed(2) : '0.00'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Authentication Modal */}
        <Dialog open={showAuth} onOpenChange={setShowAuth}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{authMode === 'login' ? 'Login' : 'Register'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <Label>Name</Label>
                  <Input
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              )}
              <div>
                <Label>Email</Label>
                <Input
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  type="email"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              {authError && <p className="text-sm text-red-500">{authError}</p>}
              <Button onClick={handleAuth} className="w-full">
                {authMode === 'login' ? 'Login' : 'Register'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="w-full"
              >
                {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Order History Modal */}
        <Dialog open={showOrders} onOpenChange={setShowOrders}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>My Orders</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {orderHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-500">No orders yet.</p>
                </div>
              ) : (
                orderHistory.map((order, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">Order #{order.id?.slice(-8) || i + 1}</span>
                      <span className="text-sm text-gray-500">{new Date(order.placedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {order.items?.map((item: any, idx: number) => (
                        <span key={idx} className="inline-block bg-white px-2 py-1 rounded mr-2 mb-1">
                          {item.name} x{item.quantity}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">${order.total?.toFixed(2)}</span>
                      <span className="text-sm text-green-600 font-semibold">{order.status || 'Completed'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Order Tracking Dialog */}
        {lastOrder && (
          <Dialog open={showTracking} onOpenChange={setShowTracking}>
            <DialogContent className="max-w-md">
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
      </div>
    );
  }