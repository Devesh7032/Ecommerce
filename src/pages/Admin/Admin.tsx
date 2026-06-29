import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { 
  ShieldAlert, 
  BarChart3, 
  ShoppingBag, 
  Layers, 
  TrendingUp, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  FileSpreadsheet,
  Bell,
  LogOut,
  Search,
  Filter,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sale_price: number | null;
  sku: string;
  stock_quantity: number;
  category_id: string;
  images: string[];
  brand: string;
  rating: number;
  reviews_count: number;
  attributes: any;
  created_at: string;
  categories?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  description: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  user_id: string;
  profiles?: {
    full_name: string;
    username: string;
  };
}

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  role: string;
  created_at: string;
}

interface Notification {
  id: string;
  message: string;
  created_at: Date;
  read: boolean;
}

export const Admin: React.FC = () => {
  const { profile, loading: authLoading, signOut } = useAuthStore();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'categories' | 'orders' | 'users'>('analytics');

  // Loading & Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Login Portal States
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Live Notification States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  // Lists Search & Filters States
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [userSearch, setUserSearch] = useState('');

  // CRUD Product Form States
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodSalePrice, setProdSalePrice] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodImage, setProdImage] = useState('');

  // CRUD Category Form States
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('');

  // Load Admin Data on authentication verification
  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        // Fetch products
        const { data: prodData } = await supabase
          .from('products')
          .select('*, categories(name)')
          .order('created_at', { ascending: false });
        setProducts(prodData as unknown as Product[] || []);

        // Fetch categories
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        setCategories(catData as Category[] || []);

        // Fetch orders
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, profiles(full_name, username)')
          .order('created_at', { ascending: false });
        setOrders(orderData as unknown as Order[] || []);

        // Fetch profiles
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        setUsers(userData as UserProfile[] || []);

      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [profile]);

  // Supabase Real-time Order Alerts Listener
  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;

    const channel = supabase
      .channel('admin-realtime-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          // Fetch new order with user profile details
          const { data: orderWithProfile } = await supabase
            .from('orders')
            .select('*, profiles(full_name, username)')
            .eq('id', payload.new.id)
            .single();

          const buyerName = orderWithProfile?.profiles?.full_name || 'A customer';
          const totalStr = Number(payload.new.total_amount).toFixed(2);
          const messageText = `${buyerName} placed a new order of $${totalStr}!`;
          
          const newNotif: Notification = {
            id: payload.new.id,
            message: messageText,
            created_at: new Date(),
            read: false
          };

          setNotifications(prev => [newNotif, ...prev]);
          setActiveToast(messageText);

          // Clear toast after 5s
          setTimeout(() => {
            setActiveToast(null);
          }, 5000);

          // Update local orders list state
          if (orderWithProfile) {
            setOrders(prev => [orderWithProfile as unknown as Order, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  // Dedicated Admin Authentication with Auto-signup configuration
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    const emailInput = adminEmail.trim();
    const passwordInput = adminPassword;

    try {
      // 1. Attempt login with credentials via Supabase
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });

      if (signInError) {
        // 2. Check for matching separate admin email/password to auto-provision
        if (emailInput === 'admin@nexashop.com' && passwordInput === 'AdminSecure2026!') {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: emailInput,
            password: passwordInput,
            options: {
              data: {
                username: 'admin',
                full_name: 'Administrator'
              }
            }
          });

          if (signUpError) throw signUpError;

          if (signUpData.user) {
            // 3. Set the new user's role to 'admin' in profiles table
            const { error: roleError } = await supabase
              .from('profiles')
              .update({ role: 'admin' })
              .eq('id', signUpData.user.id);

            if (roleError) throw roleError;

            // 4. Authenticate session
            const { error: reSignInError } = await supabase.auth.signInWithPassword({
              email: emailInput,
              password: passwordInput
            });
            if (reSignInError) throw reSignInError;

            window.location.reload();
            return;
          }
        }
        throw signInError;
      }

      window.location.reload();
    } catch (err: any) {
      setLoginError(err.message || 'Verification failed. Invalid credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // PRODUCT CRUD OPERATIONS
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setProdSalePrice('');
    setProdSku(`NX-SKU-${Math.floor(100000 + Math.random() * 900000)}`);
    setProdStock('25');
    setProdCatId(categories[0]?.id || '');
    setProdBrand('');
    setProdImage('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80');
    setShowProductForm(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdDesc(prod.description || '');
    setProdPrice(prod.price.toString());
    setProdSalePrice(prod.sale_price?.toString() || '');
    setProdSku(prod.sku);
    setProdStock(prod.stock_quantity.toString());
    setProdCatId(prod.category_id);
    setProdBrand(prod.brand);
    setProdImage(prod.images[0] || '');
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const price = parseFloat(prodPrice);
    const sale_price = prodSalePrice ? parseFloat(prodSalePrice) : null;
    const stock_quantity = parseInt(prodStock, 10);

    const payload = {
      name: prodName,
      description: prodDesc,
      price,
      sale_price,
      sku: prodSku,
      stock_quantity,
      category_id: prodCatId,
      images: [prodImage],
      brand: prodBrand,
      attributes: { brand: prodBrand, color: 'Default Black' }
    };

    try {
      if (editingProduct) {
        // Update
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        
        // Update local state
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...payload, categories: { name: categories.find(c => c.id === prodCatId)?.name || '' } } : p));
      } else {
        // Create
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select('*, categories(name)')
          .single();

        if (error) throw error;
        if (data) {
          setProducts([data as unknown as Product, ...products]);
        }
      }
      setShowProductForm(false);
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (!error) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // CATEGORY OPERATIONS
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: catName,
        slug: catSlug.trim().toLowerCase() || catName.toLowerCase().replace(/ /g, '-'),
        description: catDesc,
        image_url: catImage || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800'
      };

      const { data, error } = await supabase
        .from('categories')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCategories([...categories, data as Category]);
        setShowCatForm(false);
        setCatName('');
        setCatSlug('');
        setCatDesc('');
      }
    } catch (err) {
      console.error("Error adding category:", err);
    } finally {
      setLoading(false);
    }
  };

  // ORDER OPERATIONS (Update status)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  // USER PRIVILEGE OPERATIONS
  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'customer' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: nextRole } : u));
    }
  };

  // Notification management helpers
  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // List Filters Calculations
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.profiles?.full_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.profiles?.username || '').toLowerCase().includes(orderSearch.toLowerCase());
      
    const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) || 
    (u.username || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  // Analytics Metrics Calculations
  const totalSales = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const ordersCompletedCount = orders.filter(o => o.status !== 'Cancelled').length;
  const avgOrderVal = ordersCompletedCount > 0 ? totalSales / ordersCompletedCount : 0;
  const totalCustomersCount = users.length;

  // Custom Weekly Sales aggregator for SVG bar chart
  const getWeeklySalesData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesMap = new Map<string, number>();
    
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      salesMap.set(dayName, 0);
    }
    
    // Add completed order values
    orders
      .filter(o => o.status !== 'Cancelled')
      .forEach(o => {
        const orderDate = new Date(o.created_at);
        const dayName = days[orderDate.getDay()];
        if (salesMap.has(dayName)) {
          salesMap.set(dayName, salesMap.get(dayName)! + Number(o.total_amount));
        }
      });
      
    return Array.from(salesMap.entries()).map(([day, amount]) => ({ day, amount }));
  };

  const weeklySales = getWeeklySalesData();
  const maxSales = Math.max(...weeklySales.map(d => d.amount), 1);

  // Auth/Loading States Views
  if (authLoading || (loading && products.length === 0)) {
    return (
      <div className="min-h-screen pt-28 flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-accent-purple animate-spin"></div>
      </div>
    );
  }

  // 1. Restricted Login Portal Screen
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="w-full min-h-screen pt-28 px-4 flex items-center justify-center relative">
        <div className="bg-mesh"></div>
        <div className="w-full max-w-md glass-panel p-8 border border-white/10 rounded-2xl flex flex-col gap-6 bg-[#07070a]/95 text-white shadow-2xl relative">
          
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shadow-neon-orange/10">
              <ShieldAlert className="w-7 h-7 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Admin Portal Access</h2>
              <p className="text-xs text-gray-500 mt-1">This section is restricted to authorized personnel only.</p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Email Address</label>
              <input 
                type="email" required placeholder="admin@nexashop.com"
                value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                className="bg-[#09090D] border border-white/10 rounded-lg p-3 text-xs text-white outline-none focus:border-yellow-500/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Security Password</label>
              <input 
                type="password" required placeholder="••••••••"
                value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                className="bg-[#09090D] border border-white/10 rounded-lg p-3 text-xs text-white outline-none focus:border-yellow-500/50"
              />
            </div>

            {loginError && (
              <p className="text-[10px] text-red-400 font-semibold">{loginError}</p>
            )}

            <button 
              type="submit" 
              disabled={loginLoading}
              className="w-full py-3 rounded-lg text-xs font-bold bg-white text-black hover:bg-gray-200 transition-all cursor-pointer flex justify-center items-center shadow-neon"
            >
              {loginLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin"></div>
              ) : (
                'Verify & Authenticate'
              )}
            </button>
          </form>
          
          <div className="text-center text-[10px] text-gray-600 border-t border-white/5 pt-4">
            Use credentials:<br/>
            Email: <span className="text-gray-400 font-mono select-all">admin@nexashop.com</span> | Password: <span className="text-gray-400 font-mono select-all">AdminSecure2026!</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Admin Dashboard Console (If authorized)
  return (
    <div className="w-full min-h-screen pt-28 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col gap-6 relative">
      <div className="bg-mesh"></div>

      {/* Floating alert toasts */}
      <AnimatePresence>
        {activeToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 p-4 rounded-xl glass-panel border border-purple-500/30 bg-[#09090e]/95 text-white max-w-sm shadow-2xl flex items-start gap-3"
          >
            <Bell className="w-5 h-5 text-purple-400 animate-bounce shrink-0 mt-0.5" />
            <div className="flex-grow">
              <span className="text-xs font-bold block text-white">New Order Alert!</span>
              <span className="text-[11px] text-gray-300 block mt-1 leading-normal">{activeToast}</span>
            </div>
            <button 
              onClick={() => setActiveToast(null)}
              className="p-0.5 text-gray-500 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Top Header Bar with Notifications Bell */}
      <div className="flex justify-between items-center bg-white/2 border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-yellow-500 animate-pulse" />
          <span className="font-extrabold text-sm text-white tracking-widest uppercase">Admin Terminal</span>
        </div>

        <div className="flex items-center gap-4 relative">
          {/* Notifications bell button */}
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </button>

          {/* Notifications List Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-12 right-0 w-80 glass-panel border border-white/10 rounded-xl p-4 bg-[#09090e] z-40 shadow-2xl flex flex-col gap-3"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white">Sales Feed Alerts</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[9px] text-purple-400 hover:underline"
                    >
                      Mark read
                    </button>
                    <button 
                      onClick={handleClearNotifications}
                      className="text-[9px] text-red-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-2.5 rounded-lg border text-[11px] leading-relaxed transition-all ${
                          notif.read 
                            ? 'bg-transparent border-white/2 text-gray-500' 
                            : 'bg-purple-500/5 border-purple-500/10 text-gray-300 font-semibold'
                        }`}
                      >
                        {notif.message}
                        <span className="block text-[8px] text-gray-600 mt-1">
                          {notif.created_at.toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-gray-600">No new alerts received.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign Out */}
          <button 
            onClick={signOut}
            className="px-3.5 py-2 rounded-xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-full lg:w-64 glass-panel p-5 shrink-0 flex flex-col gap-6 shadow-glass border border-white/5 h-fit">
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'analytics', label: 'Marketplace Stats', icon: BarChart3 },
              { id: 'products', label: 'Manage Products', icon: ShoppingBag },
              { id: 'categories', label: 'Manage Categories', icon: Layers },
              { id: 'orders', label: 'Manage Orders', icon: FileSpreadsheet },
              { id: 'users', label: 'Manage Users', icon: Users }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-400 font-bold shadow-neon-purple/10' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <tab.icon className="w-4.5 h-4.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MAIN ADMIN WORK AREA */}
        <main className="flex-grow w-full flex flex-col gap-6 overflow-hidden">
          
          {/* TAB 1: ANALYTICS DASHBOARD */}
          {activeTab === 'analytics' && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Marketplace Analytics</h2>
                <p className="text-xs text-gray-500 mt-0.5">Overall platform transaction tracking and users</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', value: `$${totalSales.toFixed(2)}`, icon: TrendingUp, color: 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20' },
                  { label: 'Orders Logged', value: ordersCompletedCount.toString(), icon: ShoppingBag, color: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20' },
                  { label: 'Avg Ticket Size', value: `$${avgOrderVal.toFixed(2)}`, icon: BarChart3, color: 'text-accent-purple bg-accent-purple/10 border-accent-purple/20' },
                  { label: 'Active Users', value: totalCustomersCount.toString(), icon: Users, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' }
                ].map((stat, idx) => (
                  <div key={idx} className="glass-card p-5 border border-white/5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</span>
                      <span className="text-xl font-black text-white">{stat.value}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Animated SVG performance bar chart */}
              <div className="glass-panel p-6 border border-white/5 shadow-glass flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="font-bold text-sm text-white">Weekly Performance Matrix</h3>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Gross Transaction Volume</span>
                </div>
                <div className="relative pt-6 h-64 flex items-end justify-between gap-4 px-2">
                  {weeklySales.map((data, idx) => {
                    const percent = (data.amount / maxSales) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                        {/* Tooltip on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-[90%] bg-[#0f0f18] border border-white/10 px-2 py-1 rounded text-[9px] text-white font-bold pointer-events-none z-10 whitespace-nowrap">
                          ${data.amount.toFixed(2)}
                        </div>
                        
                        {/* Column Bar with Framer Motion height scale */}
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${percent * 0.7}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05, ease: 'easeOut' }}
                          className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 cursor-pointer shadow-neon-purple/20 min-h-[4px]"
                        />
                        
                        <span className="text-[10px] text-gray-500 font-semibold">{data.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGEMENT (CRUD TABLE) */}
          {activeTab === 'products' && (
            <div className="flex flex-col gap-6">
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Catalog Ledger</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Add, edit, or delete items within the inventory</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search filter for products list */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search name, brand, SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="bg-[#09090D] border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-600 outline-none w-52 focus:border-purple-500/50"
                    />
                  </div>
                  <button 
                    onClick={handleOpenAddProduct}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 cursor-pointer shadow-neon flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>
              </div>

              {/* PRODUCT ADD/EDIT DIALOG FORM */}
              {showProductForm && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-6 border border-white/5 shadow-glass"
                >
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider mb-4">
                    {editingProduct ? 'Edit Product Item' : 'Create Product Entry'}
                  </h3>
                  <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product Name</label>
                      <input 
                        type="text" required placeholder="Name"
                        value={prodName} onChange={(e) => setProdName(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SKU Code</label>
                      <input 
                        type="text" required placeholder="SKU"
                        value={prodSku} onChange={(e) => setProdSku(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price ($)</label>
                      <input 
                        type="number" step="0.01" required placeholder="Price"
                        value={prodPrice} onChange={(e) => setProdPrice(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Discount/Sale Price ($)</label>
                      <input 
                        type="number" step="0.01" placeholder="Optional Sale Price"
                        value={prodSalePrice} onChange={(e) => setProdSalePrice(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stock Qty</label>
                      <input 
                        type="number" required placeholder="Stock"
                        value={prodStock} onChange={(e) => setProdStock(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                      <select 
                        value={prodCatId} onChange={(e) => setProdCatId(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-gray-300 outline-none w-full focus:border-accent-purple/50"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brand</label>
                      <input 
                        type="text" required placeholder="Brand name"
                        value={prodBrand} onChange={(e) => setProdBrand(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Image Cover URL</label>
                      <input 
                        type="text" required placeholder="Unsplash URL"
                        value={prodImage} onChange={(e) => setProdImage(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product Description</label>
                      <textarea 
                        required rows={3} placeholder="Write copy content description..."
                        value={prodDesc} onChange={(e) => setProdDesc(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50 resize-none w-full"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                      <button 
                        type="button" 
                        onClick={() => setShowProductForm(false)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold border border-white/5 bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-5 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 cursor-pointer"
                      >
                        Save Product
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* PRODUCTS LISTING TABLE */}
              <div className="glass-panel overflow-x-auto border border-white/5 shadow-glass">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/2 border-b border-white/5 text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                    <tr>
                      <th className="p-4">SKU / Item</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-white/2 transition-colors">
                          <td className="p-4 flex items-center gap-3 font-semibold text-white">
                            <img 
                              src={prod.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80'} 
                              alt="" 
                              className="w-9 h-9 rounded object-cover bg-[#0c0c14] border border-white/5 shrink-0" 
                              onError={(e) => {
                                const target = e.currentTarget;
                                const fallback = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80';
                                if (target.src !== fallback) {
                                  target.src = fallback;
                                }
                              }}
                            />
                            <div className="flex flex-col truncate">
                              <span className="truncate max-w-[200px] text-xs">{prod.name}</span>
                              <span className="text-[9px] text-gray-600 font-mono mt-0.5">{prod.sku}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-400">{prod.categories?.name}</td>
                          <td className="p-4 font-semibold text-white">${prod.price.toFixed(2)}</td>
                          <td className="p-4">
                            {/* Flipkart style Low Stock warnings */}
                            {prod.stock_quantity <= 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                Out of stock
                              </span>
                            ) : prod.stock_quantity <= 5 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 animate-pulse">
                                Low Stock ({prod.stock_quantity})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                In Stock ({prod.stock_quantity})
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button 
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 rounded-lg border border-white/5 bg-white/2 hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs text-gray-600">No products match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="flex flex-col gap-6">
              
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Collection Ledger</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Manage and append catalog store categories</p>
                </div>
                <button 
                  onClick={() => setShowCatForm(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 cursor-pointer shadow-neon flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>

              {/* CATEGORY ADD FORM */}
              {showCatForm && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-6 border border-white/5 shadow-glass"
                >
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider mb-4">Add Store Collection Category</h3>
                  <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category Name</label>
                      <input 
                        type="text" required placeholder="Name"
                        value={catName} onChange={(e) => setCatName(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">URL Slug</label>
                      <input 
                        type="text" placeholder="e.g. smart-watches"
                        value={catSlug} onChange={(e) => setCatSlug(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Image Graphic URL</label>
                      <input 
                        type="text" placeholder="Category Unsplash URL"
                        value={catImage} onChange={(e) => setCatImage(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                      <textarea 
                        required rows={3} placeholder="Collection description..."
                        value={catDesc} onChange={(e) => setCatDesc(e.target.value)}
                        className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50 resize-none w-full"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                      <button 
                        type="button" 
                        onClick={() => setShowCatForm(false)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold border border-white/5 bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-5 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 cursor-pointer"
                      >
                        Save Category
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* CATEGORIES TABLE */}
              <div className="glass-panel overflow-x-auto border border-white/5 shadow-glass">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/2 border-b border-white/5 text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                    <tr>
                      <th className="p-4">Category Name</th>
                      <th className="p-4">Slug Reference</th>
                      <th className="p-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-white/2 transition-colors">
                        <td className="p-4 flex items-center gap-3 font-semibold text-white">
                          <img 
                            src={cat.image_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80'} 
                            alt="" 
                            className="w-9 h-9 rounded object-cover bg-[#0c0c14] border border-white/5 shrink-0" 
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80';
                              if (target.src !== fallback) {
                                target.src = fallback;
                              }
                            }}
                          />
                          {cat.name}
                        </td>
                        <td className="p-4 font-mono text-gray-400">{cat.slug}</td>
                        <td className="p-4 text-gray-500 max-w-sm truncate">{cat.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: ORDERS */}
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-6">
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Order Registry</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Monitor and transition order status levels for deliveries</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Status filter */}
                  <div className="flex items-center gap-1 bg-[#09090D] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-400">
                    <Filter className="w-3.5 h-3.5 text-gray-500 mr-1" />
                    <select 
                      value={orderStatusFilter} 
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-transparent text-gray-300 outline-none cursor-pointer text-xs"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out For Delivery">Out For Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search recipient, order ID..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="bg-[#09090D] border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-600 outline-none w-52 focus:border-purple-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* ORDERS LISTING TABLE */}
              <div className="glass-panel overflow-x-auto border border-white/5 shadow-glass">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/2 border-b border-white/5 text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                    <tr>
                      <th className="p-4">Order Reference</th>
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Status Badges</th>
                      <th className="p-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((ord) => {
                        // Badge color calculations
                        let statusColor = 'bg-gray-500/10 border-gray-500/20 text-gray-400';
                        if (ord.status === 'Pending') statusColor = 'bg-orange-500/10 border-orange-500/20 text-orange-400';
                        else if (ord.status === 'Processing' || ord.status === 'Packed') statusColor = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
                        else if (ord.status === 'Shipped' || ord.status === 'Out For Delivery') statusColor = 'bg-purple-500/10 border-purple-500/20 text-purple-400';
                        else if (ord.status === 'Delivered') statusColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                        else if (ord.status === 'Cancelled') statusColor = 'bg-rose-500/10 border-rose-500/20 text-rose-400';

                        return (
                          <tr key={ord.id} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 font-semibold text-white font-mono text-xs">
                              #{ord.id.substring(0, 8).toUpperCase()}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-white">{ord.profiles?.full_name || 'Anonymous User'}</span>
                                <span className="text-[9px] text-gray-500 mt-0.5">@{ord.profiles?.username}</span>
                              </div>
                            </td>
                            <td className="p-4 font-bold text-white">${Number(ord.total_amount).toFixed(2)}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                  {ord.status}
                                </span>
                                <select 
                                  value={ord.status} 
                                  onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                  className="bg-[#09090D] border border-white/10 rounded-lg p-1.5 text-xs text-gray-300 outline-none focus:border-accent-purple/50 cursor-pointer"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Packed">Packed</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Out For Delivery">Out For Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>
                            </td>
                            <td className="p-4 text-right text-gray-500">
                              {new Date(ord.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs text-gray-600">No orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 5: USERS */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-6">
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Identity Register</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Manage user credentials and privilege permissions</p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    placeholder="Search username, name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="bg-[#09090D] border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-600 outline-none w-52 focus:border-purple-500/50"
                  />
                </div>
              </div>

              {/* USERS LISTING TABLE */}
              <div className="glass-panel overflow-x-auto border border-white/5 shadow-glass">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/2 border-b border-white/5 text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Username</th>
                      <th className="p-4">Authorization Role</th>
                      <th className="p-4 text-right">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((usr) => (
                        <tr key={usr.id} className="hover:bg-white/2 transition-colors">
                          <td className="p-4 font-semibold text-white text-xs">{usr.full_name || 'No Name'}</td>
                          <td className="p-4 font-mono text-gray-400">@{usr.username || 'unknown'}</td>
                          <td className="p-4">
                            <button 
                              onClick={() => handleToggleUserRole(usr.id, usr.role)}
                              className={`px-3 py-1 rounded text-[10px] font-bold cursor-pointer transition-all border ${
                                usr.role === 'admin' 
                                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' 
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                              }`}
                            >
                              {usr.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                            </button>
                          </td>
                          <td className="p-4 text-right text-gray-500">
                            {new Date(usr.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-xs text-gray-600">No users match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
};
