import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, ShoppingCart, Star, Clock, Leaf, Flame, Heart, Sparkles, Moon, Sun, X, Check, RefreshCw, QrCode, Package, User, MapPin, Printer, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, isSupabaseDevFallback, forceRealMode } from '@/integrations/supabase/client';
import { withTimeout as fastTimeout } from '@/lib/fastCache';
import { orderHistoryService } from '@/lib/orderHistoryService';
import { formatCurrency } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ArrowLeft, Utensils } from 'lucide-react';

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
  created_at?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  special_instructions?: string;
  addons?: string[];
  variant?: string;
  menu_item_id: string; // Store the original menu item ID
}

export default function Order() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const location = useLocation();
  const { toast } = useToast();
  
  // Extract table number from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const tableNumberFromUrl = urlParams.get('table');
  
  // Debug logging
  console.log('Order component mounted with:', {
    restaurantId,
    tableNumberFromUrl,
    pathname: location.pathname,
    search: location.search
  });
  
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
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('regular');
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
  interface Review { rating: number; comment: string; author?: string }
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
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
  const [lastOrder, setLastOrder] = useState<LocalOrder | null>(null);
  const [showTracking, setShowTracking] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState<LocalOrder | null>(null);
  const [realTimeSubscription, setRealTimeSubscription] = useState<ReturnType<typeof supabase.channel> | null>(null);
  interface LocalOrderItem { name?: string; menu_item_name?: string; quantity: number; price: number; notes?: string }
  interface LocalOrder { id: string; email: string; items: LocalOrderItem[]; status?: string; placedAt?: number; estReady?: number }
  const [orderHistory, setOrderHistory] = useState<LocalOrder[]>([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  // On mount, load last order and order history from cookies
  useEffect(() => {
    const saved = localStorage.getItem('last_order');
    if (saved) {
      const order = JSON.parse(saved);
      console.log('Loading order from localStorage:', order);
      console.log('Order ID from localStorage:', order.id);
      console.log('Is localStorage order local?', order.id.startsWith('local-'));
      
      setLastOrder(order);
      
      // Check if order is completed and hide tracking if so
      if (order.status === 'completed' || order.status === 'cancelled') {
        setShowTracking(false);
      }
    }
    
    // Load order history from cookies
    const history = getOrderHistoryFromCookies();
    setOrderHistory(history);
  }, []);

  // Set up real-time subscription for order updates
  useEffect(() => {
    if (lastOrder?.id && !lastOrder.id.startsWith('local-')) {
      console.log('Setting up real-time subscription for order:', lastOrder.id);
      
      const subscription = supabase
        .channel(`order-${lastOrder.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${lastOrder.id}`
          },
          (payload) => {
            console.log('Order update received:', payload);
            console.log('Old status:', payload.old?.status, 'New status:', payload.new.status);
            
            setOrderUpdates(payload.new);
            
            // Update the last order with new status
            setLastOrder(prev => {
              const updatedOrder = {
                ...prev,
                status: payload.new.status,
                updated_at: payload.new.updated_at
              };
              console.log('Updated lastOrder:', updatedOrder);
              return updatedOrder;
            });
            
            // Show notification for status changes
            if (payload.new.status !== payload.old?.status) {
              const statusLabels = {
                'pending': 'Order Placed',
                'confirmed': 'Order Confirmed',
                'preparing': 'Preparing Your Order',
                'ready': 'Your Order is Ready!',
                'completed': 'Order Completed',
                'cancelled': 'Order Cancelled'
              };
              
              toast({
                title: "Order Status Updated!",
                description: `Your order is now: ${statusLabels[payload.new.status as keyof typeof statusLabels] || payload.new.status}`,
                duration: 5000,
              });

              // Auto-hide tracking for completed/cancelled orders after 5 seconds
              if (payload.new.status === 'completed' || payload.new.status === 'cancelled') {
                setTimeout(() => {
                  setShowTracking(false);
                  toast({
                    title: "Order Complete",
                    description: "Order tracking has been hidden. You can view your order history anytime.",
                    duration: 3000,
                  });
                }, 5000);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Real-time subscription connected successfully');
            setOrderUpdates(lastOrder); // Set initial connection state
          }
        });

      setRealTimeSubscription(subscription);

      return () => {
        console.log('Cleaning up real-time subscription');
        subscription.unsubscribe();
      };
    } else if (lastOrder?.id?.startsWith('local-')) {
      console.log('Local order detected, skipping real-time subscription');
      setOrderUpdates(null); // Clear real-time state for local orders
    }

    // Cleanup subscription on unmount
    return () => {
      if (realTimeSubscription) {
        console.log('Cleaning up real-time subscription on unmount');
        realTimeSubscription.unsubscribe();
      }
    };
  }, [lastOrder?.id]);

  // Dev fallback: cross-tab real-time via localStorage when Supabase Realtime isn't available
  useEffect(() => {
    if (!lastOrder?.id) return;
    if (!isSupabaseDevFallback) return;

    const findLocalDemoOrder = (): any | null => {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) || '';
          if (key.startsWith('demo_orders:')) {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const list = JSON.parse(raw) as any[];
            const found = list.find(o => o.id === lastOrder.id);
            if (found) return found;
          }
        }
      } catch (e) {
        console.warn('Error scanning demo orders:', e);
      }
      return null;
    };

    const applyUpdate = (newOrder: any) => {
      setLastOrder(prev => {
        if (!prev) return prev;
        if (!newOrder) return prev;
        if (prev.status === newOrder.status) return prev;
        const updated = { ...prev, status: newOrder.status, updated_at: newOrder.updated_at } as any;
        localStorage.setItem('last_order', JSON.stringify(updated));
        const labelMap: Record<string, string> = {
          pending: 'Order Placed',
          confirmed: 'Order Confirmed',
          preparing: 'Preparing Your Order',
          ready: 'Your Order is Ready!',
          completed: 'Order Completed',
          cancelled: 'Order Cancelled'
        };
        toast({ title: 'Order Status Updated!', description: `Your order is now: ${labelMap[updated.status] || updated.status}` });
        if (updated.status === 'completed' || updated.status === 'cancelled') {
          setTimeout(() => setShowTracking(false), 5000);
        }
        return updated;
      });
    };

    // Listen for cross-tab storage events
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith('demo_orders:')) return;
      try {
        const list = e.newValue ? JSON.parse(e.newValue) as any[] : [];
        const found = list.find(o => o.id === lastOrder.id);
        if (found) applyUpdate(found);
      } catch {}
    };
    window.addEventListener('storage', onStorage);

    // Also poll as a safety net (covers same-tab admin actions)
    const interval = setInterval(() => {
      const found = findLocalDemoOrder();
      if (found) applyUpdate(found);
    }, 1500);

    // Initial sync
    const initial = findLocalDemoOrder();
    if (initial) applyUpdate(initial);

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, [lastOrder?.id, isSupabaseDevFallback]);

  // Order tracking status logic
  const getOrderStatus = (order: LocalOrder | null) => {
    if (!order) return 'pending';
    // Use the actual status from the database if available
    if (order.status) return order.status;
    
    // Fallback to calculated status for local orders
    const now = Date.now();
    if (now < order.placedAt + 5 * 60 * 1000) return 'pending'; // 0-5 min
    if (now < order.placedAt + 20 * 60 * 1000) return 'preparing'; // 5-20 min
    if (now < order.estReady) return 'ready'; // 20-25 min
    return 'completed';
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'confirmed': return 'Order Confirmed';
      case 'preparing': return 'Preparing Your Order';
      case 'ready': return 'Ready for Pickup/Delivery';
      case 'completed': return 'Order Completed';
      case 'cancelled': return 'Order Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  const getProgress = (order: LocalOrder | null) => {
    if (!order) return 0;
    
    // Use status-based progress for database orders
    if (order.status) {
      switch (order.status) {
        case 'pending': return 10;
        case 'confirmed': return 25;
        case 'preparing': return 50;
        case 'ready': return 85;
        case 'completed': return 100;
        case 'cancelled': return 0;
        default: return 10;
      }
    }
    
    // Fallback to time-based progress for local orders
    const now = Date.now();
    const total = order.estReady - order.placedAt;
    const elapsed = Math.min(now - order.placedAt, total);
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };
  const getEta = (order: LocalOrder | null) => {
    if (!order) return '';
    
    // Use status-based ETA for database orders
    if (order.status) {
      switch (order.status) {
        case 'pending': return 'Waiting for confirmation';
        case 'confirmed': return 'Order confirmed, preparing soon';
        case 'preparing': return 'Your order is being prepared';
        case 'ready': return 'Your order is ready!';
        case 'completed': return 'Order completed';
        case 'cancelled': return 'Order cancelled';
        default: return 'Processing...';
      }
    }
    
    // Fallback to time-based ETA for local orders
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
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string} | null>(null);
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
                setCouponError(`Minimum order ${formatCurrency(found.min)} required for this coupon.`);
      setAppliedCoupon(null);
      setDiscount(0);
      return;
    }
    setAppliedCoupon({ code: found.code });
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
      setOrderHistory(allOrders.filter((o: LocalOrder) => o.email === user.email));
    }
  }, [user, showOrders]);

  // Cookie management functions
  const getOrderHistoryFromCookies = () => {
    try {
      const cookies = document.cookie.split(';');
      const orderHistoryCookie = cookies.find(cookie => cookie.trim().startsWith('order_history='));
      if (orderHistoryCookie) {
        const value = orderHistoryCookie.split('=')[1];
        return JSON.parse(decodeURIComponent(value));
      }
    } catch (error) {
      console.error('Error parsing order history from cookies:', error);
    }
    return [];
  };

  // Save each new order to order_history
  const saveOrderToHistory = (order: LocalOrder) => {
    try {
      const history = getOrderHistoryFromCookies();
      const newHistory = [order, ...history].slice(0, 50); // Keep last 50 orders
      
      // Save to cookies with 30 days expiration
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `order_history=${encodeURIComponent(JSON.stringify(newHistory))}; expires=${expires.toUTCString()}; path=/`;
      
      // Also save to localStorage as backup
      localStorage.setItem('order_history', JSON.stringify(newHistory));
      
      setOrderHistory(newHistory);
    } catch (error) {
      console.error('Error saving order to history:', error);
    }
  };

  const clearCompletedOrder = (orderId: string) => {
    try {
      const history = getOrderHistoryFromCookies();
      const updatedHistory = history.filter(order => order.id !== orderId);
      
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `order_history=${encodeURIComponent(JSON.stringify(updatedHistory))}; expires=${expires.toUTCString()}; path=/`;
      
      localStorage.setItem('order_history', JSON.stringify(updatedHistory));
      setOrderHistory(updatedHistory);
      
      // Clear last order if it's the completed one
      if (lastOrder?.id === orderId) {
        localStorage.removeItem('last_order');
        setLastOrder(null);
        setShowTracking(false);
      }
    } catch (error) {
      console.error('Error clearing completed order:', error);
    }
  };

  const generateBill = async (order: LocalOrder) => {
    const billWindow = window.open('', '_blank', 'width=800,height=600');
    if (!billWindow) return;

    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - Order #${order.id.slice(-8)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .restaurant-name { font-size: 24px; font-weight: bold; }
          .order-info { margin-bottom: 20px; }
          .items { margin-bottom: 20px; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 1px solid #ccc; padding-top: 10px; font-weight: bold; font-size: 18px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">${restaurant?.name || 'Restaurant'}</div>
          <div>Order #${order.id.slice(-8)}</div>
          <div>${new Date(order.created_at || order.placedAt).toLocaleString()}</div>
        </div>
        
        <div class="order-info">
          <div><strong>Customer:</strong> ${order.customer_name || order.customer}</div>
          <div><strong>Table:</strong> ${order.table_number || order.tableNumber}</div>
          <div><strong>Status:</strong> ${order.status}</div>
        </div>
        
        <div class="items">
          <h3>Order Items:</h3>
          ${(order.items || []).map((item: LocalOrderItem) => `
            <div class="item">
              <span>${item.quantity}x ${item.name || item.menu_item_name}</span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="total">
          <div class="item">
            <span>Total Amount:</span>
                                    <span>{formatCurrency(order.total_amount || order.total)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    billWindow.document.write(billHTML);
    billWindow.document.close();
    billWindow.focus();
    
    // Mark bill as generated in permanent history
    try {
      await orderHistoryService.updateOrderStatus(order.id, order.status, true);
    } catch (error) {
      console.error('Error updating bill generation status:', error);
    }
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



    useEffect(() => {
    console.log('useEffect triggered with restaurantId:', restaurantId);
    
    if (restaurantId) {
      console.log('Restaurant ID found, loading data...');
      
      // In forceRealMode, never show demo data
      if (forceRealMode) {
        setLoading(true);
      }

      // 2) Try to load real data in the background and replace if successful
      const loadRealData = async () => {
        try {
          console.log('Attempting to fetch real data from Supabase...');
          
          const { data: restaurantData, error: restaurantError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', restaurantId)
            .single();

          console.log('Restaurant query result:', { data: restaurantData, error: restaurantError });

          if (restaurantError) {
            console.error('Restaurant fetch error:', restaurantError);
            throw new Error(`Restaurant not found: ${restaurantError.message}`);
          }

          if (!restaurantData) {
            console.error('No restaurant data returned');
            throw new Error('Restaurant not found in database');
          }

          console.log('Real restaurant data found:', restaurantData);
          setRestaurant(restaurantData);
          
          // Fetch categories
          console.log('Fetching categories...');
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('menu_categories')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('sort_order');
            
          console.log('Categories query result:', { data: categoriesData, error: categoriesError });
          
          if (categoriesError) {
            console.error('Categories fetch error:', categoriesError);
          } else {
            setCategories([
              { id: 'all', name: 'All Items', description: '', sort_order: -1 },
              ...(categoriesData || [])
            ]);
          }
          
          // Fetch menu items
          console.log('Fetching menu items...');
          const { data: menuItemsData, error: menuItemsError } = await supabase
            .from('menu_items')
            .select(`
              *,
              menu_categories(name)
            `)
            .eq('restaurant_id', restaurantId)
            .eq('is_available', true)
            .order('created_at');
            
          console.log('Menu items query result:', { data: menuItemsData, error: menuItemsError });
          
          if (menuItemsError) {
            console.error('Menu items fetch error:', menuItemsError);
          } else {
            const mappedMenuItems = (menuItemsData || []).map(item => ({
              ...item,
              category: item.menu_categories?.name || 'Uncategorized'
            }));
            setMenuItems(mappedMenuItems);
          }
          
          console.log('Real data loaded successfully from Supabase');
          
        } catch (error) {
          console.error('Error loading real data:', error);
          
          // Try to retry once more
          try {
            console.log('Retrying real data fetch...');
            const { data: retryRestaurantData, error: retryRestaurantError } = await supabase
              .from('restaurants')
              .select('*')
              .eq('id', restaurantId)
              .single();
              
            if (!retryRestaurantError && retryRestaurantData) {
              console.log('Real data loaded on retry:', retryRestaurantData);
              setRestaurant(retryRestaurantData);
              
              // Fetch categories and menu items on retry
              const { data: retryCategoriesData } = await supabase
                .from('menu_categories')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('sort_order');
                
              if (retryCategoriesData) {
                setCategories([
                  { id: 'all', name: 'All Items', description: '', sort_order: -1 },
                  ...retryCategoriesData
                ]);
              }
              
              const { data: retryMenuItemsData } = await supabase
                .from('menu_items')
                .select(`
                  *,
                  menu_categories(name)
                `)
                .eq('restaurant_id', restaurantId)
                .eq('is_available', true)
                .order('created_at');
                
              if (retryMenuItemsData) {
                const mappedRetryMenuItems = retryMenuItemsData.map(item => ({
                  ...item,
                  category: item.menu_categories?.name || 'Uncategorized'
                }));
                setMenuItems(mappedRetryMenuItems);
              }
              
              setLoading(false);
              console.log('Real data loaded successfully on retry');
              return;
            }
          } catch (retryError) {
            console.error('Retry also failed:', retryError);
          }
          
          if (forceRealMode) {
            // In forceRealMode, show error instead of demo data
            setError('Failed to load restaurant data. Please try again.');
            setLoading(false);
          } else {
            console.log('Real data fetch failed, showing error state.');
            setError('Failed to load restaurant data. Please check your connection.');
            setLoading(false);
          }
        }
      };
      
      // Load real data (always try; will succeed only when envs are set)
      loadRealData();
      
      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('Real data fetch timeout');
          if (forceRealMode) {
            setError('Data loading timed out. Please try again.');
          } else {
            setError('Data loading timed out. Please check your connection.');
          }
          setLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
      
    } else {
      console.log('No restaurant ID found');
      setError('Invalid restaurant URL');
      setLoading(false);
    }
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
          menu_item_id: item.id, // Store the original menu item ID
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
    console.log('handlePlaceOrder called');
    console.log('Current placingOrder state:', placingOrder);
    
    if (!restaurant) {
      console.log('No restaurant found');
      toast({
        title: "Error",
        description: "Restaurant information not found",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      console.log('Cart is empty');
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order",
        variant: "destructive",
      });
      return;
    }

    console.log('Setting placingOrder to true');
    setPlacingOrder(true);
    console.log('Starting order placement...');

    // Optional light preflight with tight timeout (non-blocking)
    try {
      await fastTimeout(supabase.from('orders').select('id').limit(1), 2500, 'preflight');
    } catch (_) {}

    // Try to create order in Supabase
    console.log('Attempting to create order in Supabase...');
    
    try {
      // Auto-generate customer info based on table number
      const customerName = tableNumber ? `Table ${tableNumber} Guest` : 'Guest';
      const customerPhone = tableNumber ? `Table-${tableNumber}` : 'N/A';
      
      // First, create the order in Supabase
      const orderData = {
        restaurant_id: restaurant.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerInfo.email || 'guest@restaurant.com',
        table_number: tableNumber || customerInfo.tableNumber || 'Unknown',
        notes: customerInfo.notes,
        total_amount: getFinalTotal(),
        status: 'pending',
        order_type: 'dine_in',
        created_at: new Date().toISOString()
      };

      console.log('Creating order with data:', orderData);
      console.log('Restaurant ID being used:', restaurant.id);

      // Create order in Supabase with reasonable timeout
      const { data: order, error: orderError } = await fastTimeout(
        supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single(),
        15000,
        'create order'
      );

      console.log('Order creation result:', { data: order, error: orderError });

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(`Database error: ${orderError.message}`);
      }

      if (!order) {
        console.error('No order data returned');
        throw new Error('No order data returned from database');
      }

      console.log('Order created successfully in Supabase:', order);

      // Then, create order items in Supabase
      const orderItemsData = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.special_instructions || null,
        created_at: new Date().toISOString()
      }));

      console.log('Creating order items:', orderItemsData);

      // Create order items in Supabase with reasonable timeout
      const { error: itemsError } = await fastTimeout(
        supabase
          .from('order_items')
          .insert(orderItemsData),
        15000,
        'create order items'
      );

      console.log('Order items creation result:', { error: itemsError });

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        // Try to delete the order if items failed
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(`Order items error: ${itemsError.message}`);
      }

      console.log('Order placed successfully in Supabase!');
      console.log('Order ID from database:', order.id);
      console.log('Order ID type:', typeof order.id);
      console.log('Is order ID local format?', order.id.startsWith('local-'));

      // Create order summary for local tracking
      const orderSummary = {
        id: order.id,
        status: 'pending',
        placedAt: Date.now(),
        estReady: Date.now() + 25 * 60 * 1000, // 25 mins from now
        customer: customerName,
        total: getFinalTotal(),
        restaurant: restaurant.name,
        items: cart,
        email: user?.email || customerInfo.email || 'guest',
        tableNumber: tableNumber || 'Unknown',
        updated_at: order.updated_at || new Date().toISOString(),
        created_at: order.created_at || new Date().toISOString(),
      };
      
      console.log('Created orderSummary:', orderSummary);
      console.log('OrderSummary ID:', orderSummary.id);
      console.log('Is orderSummary ID local format?', orderSummary.id.startsWith('local-'));

             // Save order to history
       saveOrderToHistory(orderSummary);
       
       // Save to permanent history for admin/manager
       try {
         await orderHistoryService.saveToPermanentHistory(
           orderSummary, 
           restaurant.id, 
           restaurant.name
         );
       } catch (error) {
         console.error('Error saving to permanent history:', error);
         // Don't fail the order placement if permanent history fails
       }

      // Set the last order for tracking
      setLastOrder(orderSummary);

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

      // Show success dialog with tracking options
      setShowTracking(true);

      toast({
        title: "Order placed successfully!",
        description: `Your order #${order.id.slice(-8)} has been placed. We'll bring it to your table when ready.`,
      });

      console.log('Supabase order placement completed successfully');

    } catch (supabaseError) {
      console.error('Supabase order creation failed:', supabaseError);
      
      // Show error to user and ask to retry
      toast({
        title: "Order Placement Failed",
        description: "Could not place your order. Check internet and permissions; please try again.",
        variant: "destructive",
      });
      
      // Don't fall back to local order - force online mode
      console.log('Order placement failed, not falling back to offline mode');
      
      // Clear cart and reset state
      setCart([]);
      setShowCheckout(false);
      setCustomerInfo({
        name: '',
        phone: '',
        email: '',
        tableNumber: tableNumber || '',
        notes: '',
      });
    } finally {
      console.log('Finally block executed');
      console.log('Setting placingOrder to false');
      setPlacingOrder(false);
      console.log('placingOrder should now be false');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 max-w-md mx-4">
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOrderHistory(true)}
              className="relative text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400"
            >
              <Clock className="h-5 w-5" />
              {orderHistory.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {orderHistory.length}
                </span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCartPopup(!showCartPopup)}
              className="relative text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 cart-button"
            >
              <ShoppingCart className="h-5 w-5" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Dark Mode Toggle and Language Selector */}
      <div className="fixed top-20 right-4 z-40 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-600 shadow-lg hover:scale-110 transition-all duration-300"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Select value={lang} onValueChange={setLang}>
          <SelectTrigger className="w-20 h-8 text-xs bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                {language.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading menu...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Menu</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <Button onClick={() => {
              setError(null);
              setLoading(true);
              // Reload the data
              const loadRealData = async () => {
                try {
                  console.log('Retrying to fetch restaurant data from Supabase...');
                  
                  // First, let's check if we can connect to Supabase
                  console.log('Testing Supabase connection...');
                  const { data: testData, error: testError } = await supabase
                    .from('restaurants')
                    .select('count')
                    .limit(1);

                  console.log('Supabase connection test:', { data: testData, error: testError });

                  if (testError) {
                    console.error('Supabase connection failed:', testError);
                    setError('Database connection failed. Please check your internet connection.');
                    setLoading(false);
                    return;
                  }

                  // Fetch restaurant data
                  console.log('Fetching restaurant data...');
                  const { data: restaurantData, error: restaurantError } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('id', restaurantId)
                    .single();

                  console.log('Restaurant query result:', { data: restaurantData, error: restaurantError });

                  if (restaurantError) {
                    console.error('Restaurant fetch error:', restaurantError);
                    setError(`Restaurant not found: ${restaurantError.message}`);
                    setLoading(false);
                    return;
                  }

                  if (!restaurantData) {
                    console.error('No restaurant data returned');
                    setError('Restaurant not found');
                    setLoading(false);
                    return;
                  }

                  console.log('Restaurant found:', restaurantData);
                  setRestaurant(restaurantData);

                  // Fetch categories
                  console.log('Fetching categories...');
                  const { data: categoriesData, error: categoriesError } = await supabase
                    .from('menu_categories')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .order('sort_order');

                  console.log('Categories query result:', { data: categoriesData, error: categoriesError });

                  if (categoriesError) {
                    console.error('Categories fetch error:', categoriesError);
                    setError(`Failed to load categories: ${categoriesError.message}`);
                    setLoading(false);
                    return;
                  }

                  console.log('Categories loaded successfully:', categoriesData);
                  setCategories([
                    { id: 'all', name: 'All Items', description: '', sort_order: -1 },
                    ...(categoriesData || [])
                  ]);

                  // Fetch menu items
                  console.log('Fetching menu items...');
                  const { data: menuItemsData, error: menuItemsError } = await supabase
                    .from('menu_items')
                    .select(`
                      *,
                      menu_categories(name)
                    `)
                    .eq('restaurant_id', restaurantId)
                    .eq('is_available', true)
                    .order('created_at');

                  console.log('Menu items query result:', { data: menuItemsData, error: menuItemsError });

                  if (menuItemsError) {
                    console.error('Menu items fetch error:', menuItemsError);
                    setError(`Failed to load menu items: ${menuItemsError.message}`);
                    setLoading(false);
                    return;
                  }

                  console.log('Menu items loaded successfully:', menuItemsData);
          
                  // Map the data to include category names
                  const mappedMenuItems = (menuItemsData || []).map(item => ({
                    ...item,
                    category: item.menu_categories?.name || 'Uncategorized'
                  }));

                  setMenuItems(mappedMenuItems);
                  setLoading(false);
                  console.log('Real data loaded successfully from Supabase');
          
                } catch (error) {
                  console.error('Unexpected error:', error);
                  setError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  setLoading(false);
                }
              };

              loadRealData();
            }} className="bg-orange-500 hover:bg-orange-600 text-white">
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="min-h-screen pb-32 md:pb-0">
          {/* Restaurant Header */}
          <div className="relative h-64 md:h-80 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 dark:from-orange-600 dark:via-red-600 dark:to-pink-600 overflow-hidden">
            {restaurant?.cover_image_url ? (
              <img
                src={restaurant.cover_image_url}
                alt={restaurant.name}
                className="w-full h-full object-cover opacity-40"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-400 dark:from-orange-500 dark:to-red-500" />
            )}
            <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  {restaurant?.logo_url ? (
                    <img src={restaurant.logo_url} alt="Logo" className="w-10 h-10 rounded-full" />
                  ) : (
                    <Utensils className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{restaurant?.name}</h1>
                  <p className="text-white/90 dark:text-white/80">{restaurant?.description}</p>
                  {restaurant?.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{restaurant.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Category Navigation */}
          <div className="px-4 py-6">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-4 rounded-full whitespace-nowrap transition-all duration-200 font-medium text-base ${
                    selectedCategory === category.id
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/20'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-4 pb-32 md:pb-6">
            {itemsToShow.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No menu items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itemsToShow.map((item) => (
                  <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer">
                    <div className="relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 flex items-center justify-center rounded-t-lg">
                          <Utensils className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
                          favorites.includes(item.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                      </button>
                      <div className="absolute top-2 left-2 flex gap-1">
                        {item.is_featured && (
                          <Badge className="bg-yellow-500 text-white text-xs">Bestseller</Badge>
                        )}
                        {item.dietary_info?.includes('vegetarian') && (
                          <Badge className="bg-green-500 text-white text-xs">Veg</Badge>
                        )}
                        {item.dietary_info?.includes('spicy') && (
                          <Badge className="bg-red-500 text-white text-xs">Spicy</Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(item.price)}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{item.description}</p>
                      <Button
                        onClick={() => openItemDetails(item)}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 text-base"
                      >
                        {t('addToCart')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Summary - Fixed Bottom on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl md:hidden">
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('cart')}</span>
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(getFinalTotal())}</span>
          </div>
          <Button
            onClick={() => setShowCartPopup(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
            disabled={cart.length === 0}
          >
            {t('checkout')} ({getCartItemCount()})
          </Button>
        </div>
      </div>

      {/* Cart Summary - Sidebar on Desktop */}
      {showCartPopup && (
        <div className="hidden md:block fixed top-24 right-4 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-h-96 overflow-y-auto cart-popup">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('cart')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCartPopup(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.price * item.quantity)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Coupon Section */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Coupon code"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="flex-1 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    />
                    <Button
                      size="sm"
                      onClick={handleApplyCoupon}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Apply
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700 dark:text-green-400">Coupon applied: {appliedCoupon.code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  {couponError && <p className="text-red-500 text-sm">{couponError}</p>}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('total')}</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(getFinalTotal())}</span>
                  </div>
                  <Button
                    onClick={() => {
                      setShowCartPopup(false);
                      setShowCheckout(true);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                  >
                    {t('checkout')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Cart Popup */}
      {showCartPopup && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end cart-popup">
          <div className="w-full bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('cart')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCartPopup(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.price * item.quantity)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Coupon Section */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Coupon code"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        className="flex-1 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                      <Button
                        size="sm"
                        onClick={handleApplyCoupon}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Apply
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-700 dark:text-green-400">Coupon applied: {appliedCoupon.code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    {couponError && <p className="text-red-500 text-sm">{couponError}</p>}
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('total')}</span>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(getFinalTotal())}</span>
                    </div>
                    <Button
                      onClick={() => {
                        setShowCartPopup(false);
                        setShowCheckout(true);
                      }}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                    >
                      {t('checkout')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Complete Your Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Table Number</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{tableNumber || 'Unknown'}</p>
            </div>
            <div>
              <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Special Instructions</Label>
              <Textarea
                id="notes"
                value={customerInfo.notes}
                onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                placeholder="Any special requests or dietary requirements..."
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="text-gray-700 dark:text-gray-300">Total:</span>
              <span className="text-orange-600 dark:text-orange-400">{formatCurrency(getFinalTotal())}</span>
            </div>
            <Button
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
            >
              {placingOrder ? 'Placing Order...' : t('placeOrder')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Details Dialog */}
      <Dialog open={showItemDetails} onOpenChange={setShowItemDetails}>
        <DialogContent className="max-w-lg h-[90vh] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-4">
              {selectedItem?.image_url ? (
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="w-16 h-16 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl flex items-center justify-center shadow-lg">
                  <Utensils className="h-8 w-8 text-orange-500 dark:text-orange-400" />
                </div>
              )}
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {selectedItem?.name}
                </DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {selectedItem?.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(selectedItem?.price || 0)}
                  </span>
                  {selectedItem?.is_featured && (
                    <Badge className="bg-yellow-500 text-white text-xs">Bestseller</Badge>
                  )}
                  {selectedItem?.dietary_info?.includes('vegetarian') && (
                    <Badge className="bg-green-500 text-white text-xs">Veg</Badge>
                  )}
                  {selectedItem?.dietary_info?.includes('spicy') && (
                    <Badge className="bg-red-500 text-white text-xs">Spicy</Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Add-ons Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Customize Your Order</h4>
              </div>
              
              <div className="space-y-3">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Add-ons</h5>
                {ADDONS.map((addon) => (
                  <label 
                    key={addon.id} 
                    className="group flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-orange-300 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedAddons.includes(addon.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddons([...selectedAddons, addon.name]);
                            } else {
                              setSelectedAddons(selectedAddons.filter(name => name !== addon.name));
                            }
                          }}
                          className="w-5 h-5 text-orange-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-orange-500 dark:focus:ring-orange-400 focus:ring-2"
                        />
                        {selectedAddons.includes(addon.name) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{addon.name}</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Enhance your meal</p>
                      </div>
                    </div>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">+{formatCurrency(addon.price)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Variants Section */}
            <div>
              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Size & Style</h5>
              <div className="space-y-3">
                {VARIANTS.map((variant) => (
                  <label 
                    key={variant.id} 
                    className="group flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-orange-300 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="radio"
                          name="variant"
                          value={variant.name}
                          checked={selectedVariant === variant.name}
                          onChange={(e) => setSelectedVariant(e.target.value)}
                          className="w-5 h-5 text-orange-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-orange-500 dark:focus:ring-orange-400 focus:ring-2"
                        />
                        {selectedVariant === variant.name && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{variant.name}</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {variant.name === 'Large' ? 'Bigger portion' : 
                           variant.name === 'Spicy' ? 'Hot & flavorful' : 
                           variant.name === 'Mild' ? 'Gentle seasoning' : 'Standard size'}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {variant.price > 0 ? `+${formatCurrency(variant.price)}` : 'Free'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Special Instructions</h5>
              <Textarea
                placeholder="Any special requests, allergies, or cooking preferences..."
                className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Fixed Bottom Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Price</span>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(selectedItem ? (selectedItem.price + 
                    selectedAddons.reduce((sum, addon) => sum + ADDONS.find(a => a.name === addon)?.price || 0, 0) +
                    (selectedVariant !== 'regular' ? VARIANTS.find(v => v.name === selectedVariant)?.price || 0 : 0)
                  ) : 0)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500 dark:text-gray-400">Base Price</span>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(selectedItem?.price || 0)}
                </div>
                {selectedAddons.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''}
                  </div>
                )}
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
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 dark:from-orange-600 dark:to-red-600 dark:hover:from-orange-700 dark:hover:to-red-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Authentication Modal */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">{authMode === 'login' ? 'Login' : 'Register'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {authMode === 'register' && (
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Name</Label>
                <Input
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                type="email"
                placeholder="your@email.com"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Password</Label>
              <Input
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            {authError && <p className="text-sm text-red-500">{authError}</p>}
            <Button onClick={handleAuth} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
              {authMode === 'login' ? 'Login' : 'Register'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="w-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order History Modal */}
      <Dialog open={showOrderHistory} onOpenChange={setShowOrderHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Order History
            </DialogTitle>
            <DialogDescription>
              View your past orders and generate bills
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {orderHistory.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">No order history yet</p>
                <p className="text-sm text-gray-400">Your orders will appear here after you place them</p>
              </div>
            ) : (
              orderHistory.map((order, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Order #{order.id.slice(-8)}
                        </span>
                        <Badge className={`${
                          order.status === 'completed' ? 'bg-green-500' :
                          order.status === 'ready' ? 'bg-blue-500' :
                          order.status === 'preparing' ? 'bg-yellow-500' :
                          order.status === 'confirmed' ? 'bg-orange-500' :
                          order.status === 'cancelled' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(order.created_at || order.placedAt || order.date).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(order.total_amount || order.total)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {order.items?.length || 0} items
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-3 w-3" />
                      <span>Table {order.table_number || order.tableNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{order.customer_name || order.customer}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <div className="font-medium mb-1">Items:</div>
                    <div className="space-y-1">
                      {(order.items || []).slice(0, 3).map((item: LocalOrderItem, itemIndex: number) => (
                        <div key={itemIndex} className="flex justify-between">
                          <span>{item.quantity}x {item.name || item.menu_item_name}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {(order.items || []).length > 3 && (
                        <div className="text-gray-500 text-xs">
                          +{(order.items || []).length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                    {(order.status === 'completed' || order.status === 'ready') && (
                      <Button
                        size="sm"
                        onClick={() => generateBill(order)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Generate Bill
                      </Button>
                    )}
                    {order.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => clearCompletedOrder(order.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setLastOrder(order);
                          setShowTracking(true);
                          setShowOrderHistory(false);
                        }}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Track Order
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Order Tracking Button */}
      {lastOrder && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setShowTracking(true)}
            className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-semibold shadow-2xl rounded-full p-4 transform hover:scale-105 transition-all duration-300 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Clock className="h-5 w-5" />
                {orderUpdates && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                )}
              </div>
              <div className="text-left">
                <div className="font-bold">Track Order</div>
                <div className="text-xs opacity-90">{getEta(lastOrder)}</div>
              </div>
              {orderUpdates && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">LIVE</span>
                </div>
              )}
            </div>
          </Button>
        </div>
      )}

      {/* Order Tracking Dialog */}
      {lastOrder && (
        <Dialog open={showTracking} onOpenChange={setShowTracking}>
          <DialogContent className="max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-0 p-0 overflow-hidden max-h-[90vh] flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-500 to-red-500 text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Order Tracking</DialogTitle>
                  <p className="text-white/90 text-sm">Track your order in real-time</p>
                </div>
              </div>
            </DialogHeader>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Order Number */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-full">
                    <QrCode className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
                    <p className="font-mono font-bold text-lg text-gray-900 dark:text-gray-100">{lastOrder.id.slice(-8)}</p>
                  </div>
                </div>
                {orderUpdates && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">LIVE</span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    getOrderStatus(lastOrder) === 'completed' ? 'bg-green-500' :
                    getOrderStatus(lastOrder) === 'ready' ? 'bg-blue-500' :
                    getOrderStatus(lastOrder) === 'preparing' ? 'bg-yellow-500' :
                    getOrderStatus(lastOrder) === 'confirmed' ? 'bg-orange-500' :
                    getOrderStatus(lastOrder) === 'cancelled' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}>
                    {getOrderStatus(lastOrder) === 'completed' ? <Check className="h-4 w-4 text-white" /> :
                     getOrderStatus(lastOrder) === 'ready' ? <Clock className="h-4 w-4 text-white" /> :
                     getOrderStatus(lastOrder) === 'preparing' ? <RefreshCw className="h-4 w-4 text-white" /> :
                     getOrderStatus(lastOrder) === 'confirmed' ? <Check className="h-4 w-4 text-white" /> :
                     getOrderStatus(lastOrder) === 'cancelled' ? <X className="h-4 w-4 text-white" /> :
                     <Clock className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className={`font-semibold ${
                      getOrderStatus(lastOrder) === 'completed' ? 'text-green-700 dark:text-green-400' :
                      getOrderStatus(lastOrder) === 'ready' ? 'text-blue-700 dark:text-blue-400' :
                      getOrderStatus(lastOrder) === 'preparing' ? 'text-yellow-700 dark:text-yellow-400' :
                      getOrderStatus(lastOrder) === 'confirmed' ? 'text-orange-700 dark:text-orange-400' :
                      getOrderStatus(lastOrder) === 'cancelled' ? 'text-red-700 dark:text-red-400' :
                      'text-gray-700 dark:text-gray-400'
                    }`}>{getStatusLabel(getOrderStatus(lastOrder))}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    getOrderStatus(lastOrder) === 'completed' ? 'text-green-600 dark:text-green-400' :
                    getOrderStatus(lastOrder) === 'ready' ? 'text-blue-600 dark:text-blue-400' :
                    getOrderStatus(lastOrder) === 'preparing' ? 'text-yellow-600 dark:text-yellow-400' :
                    getOrderStatus(lastOrder) === 'confirmed' ? 'text-orange-600 dark:text-orange-400' :
                    getOrderStatus(lastOrder) === 'cancelled' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {getProgress(lastOrder).toFixed(0)}%
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Complete</p>
                </div>
              </div>

              {/* ETA with Beautiful Timer */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Time</p>
                      <p className="font-semibold text-blue-700 dark:text-blue-400">{getEta(lastOrder)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.max(0, Math.round((lastOrder.estReady - Date.now()) / 60000))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">minutes left</p>
                  </div>
                </div>
                
                {/* Beautiful Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{ 
                        width: `${getProgress(lastOrder)}%`,
                        background: `linear-gradient(90deg, #3b82f6 ${getProgress(lastOrder)}%, #8b5cf6 ${getProgress(lastOrder) + 20}%, #ec4899 ${getProgress(lastOrder) + 40}%)`
                      }}
                    />
                  </div>
                  {/* Progress indicators */}
                  <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Ordered</span>
                    <span>Preparing</span>
                    <span>Ready</span>
                    <span>Complete</span>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-500 rounded-full">
                      <ShoppingCart className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                      <p className="font-bold text-2xl text-gray-900 dark:text-gray-100">{formatCurrency(lastOrder.total)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Table {lastOrder.tableNumber}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{lastOrder.customer}</p>
                  </div>
                </div>
              </div>

              {/* Real-time indicator */}
              {orderUpdates && (
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                      ✓ Real-time updates enabled
                    </p>
                  </div>
                </div>
              )}
              
              {/* Last update time */}
              {lastOrder?.updated_at && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                        Last Updated
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {new Date(lastOrder.updated_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Debug info (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${orderUpdates ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                        Debug Info
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Order ID: {lastOrder?.id?.slice(-8)} | Status: {lastOrder?.status} | Real-time: {orderUpdates ? 'Connected' : 'Disconnected'}
                      </p>
                      <p className="text-xs text-yellow-500 dark:text-yellow-500 mt-1">
                        Order Type: {lastOrder?.id?.startsWith('local-') ? 'Local' : 'Database'} | Subscription: {realTimeSubscription ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowTracking(false)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-xl"
                >
                  Close
                </Button>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    // Refresh order status from database
                    if (lastOrder?.id && !lastOrder.id.startsWith('local-')) {
                      try {
                        console.log('Refreshing order status for:', lastOrder.id);
                        const { data: order, error } = await supabase
                          .from('orders')
                          .select('*')
                          .eq('id', lastOrder.id)
                          .single();
                        
                        if (error) {
                          console.error('Error fetching order:', error);
                          toast({
                            title: "Error",
                            description: "Failed to refresh order status",
                            variant: "destructive",
                          });
                        } else if (order) {
                          console.log('Refreshed order data:', order);
                          setLastOrder(prev => ({
                            ...prev,
                            status: order.status,
                            updated_at: order.updated_at
                          }));
                          setOrderUpdates(order);
                          toast({
                            title: "Status Refreshed",
                            description: `Order status: ${order.status}`,
                          });
                        }
                      } catch (error) {
                        console.error('Error refreshing order:', error);
                      }
                    } else {
                      // For local orders, just refresh the dialog
                      setShowTracking(false);
                      setTimeout(() => setShowTracking(true), 100);
                    }
                  }}
                  className="px-4 py-3 rounded-xl"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Connection test button (only in development) */}
              {process.env.NODE_ENV === 'development' && lastOrder?.id && !lastOrder.id.startsWith('local-') && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        console.log('Testing connection for order:', lastOrder.id);
                        const { data: order, error } = await supabase
                          .from('orders')
                          .select('*')
                          .eq('id', lastOrder.id)
                          .single();
                        
                        if (error) {
                          console.error('Connection test failed:', error);
                          toast({
                            title: "Connection Test Failed",
                            description: error.message,
                            variant: "destructive",
                          });
                        } else {
                          console.log('Connection test successful:', order);
                          toast({
                            title: "Connection Test Successful",
                            description: `Order found with status: ${order.status}`,
                          });
                        }
                      } catch (error) {
                        console.error('Connection test error:', error);
                        toast({
                          title: "Connection Test Error",
                          description: "Failed to test connection",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="w-full text-xs"
                  >
                    Test Database Connection
                  </Button>
                </div>
              )}
              
              {/* Clear localStorage button (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="pt-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem('last_order');
                      setLastOrder(null);
                      setShowTracking(false);
                      toast({
                        title: "LocalStorage Cleared",
                        description: "Order data cleared. Place a new order to test.",
                      });
                    }}
                    className="w-full text-xs"
                  >
                    Clear Order Data
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}