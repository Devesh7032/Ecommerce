import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { supabase } from '../../lib/supabase';
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  Settings, 
  DollarSign, 
  Heart, 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck,
  Plus,
  Trash2,
  Lock,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  created_at: string;
  status: 'Pending' | 'Processing' | 'Packed' | 'Shipped' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
  total_amount: number;
  tax: number;
  delivery_charge: number;
  payment_method: string;
  payment_status: string;
  address_id: string;
  order_items: OrderItem[];
}

interface Address {
  id: string;
  title: string;
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuthStore();
  const wishlistCount = useWishlistStore(state => state.items).length;

  // Active view tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'addresses' | 'profile'>('dashboard');

  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Profile Edit fields
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Address edit fields
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrTitle, setAddrTitle] = useState('Home');
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrCountry, setAddrCountry] = useState('US');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile) {
      setEditFullName(profile.full_name || '');
      setEditUsername(profile.username || '');
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch Orders + Order items + Product details
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, order_items(*, product:products(*))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setOrders(orderData as unknown as Order[] || []);

        // Fetch Addresses
        const { data: addrData } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });

        setAddresses(addrData as Address[] || []);

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate, profile]);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setProfileSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName.trim(),
          username: editUsername.trim().toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const newAddr = {
        user_id: user.id,
        title: addrTitle,
        full_name: addrFullName,
        phone: addrPhone,
        street_address: addrStreet,
        city: addrCity,
        state: addrState,
        postal_code: addrZip,
        country: addrCountry,
        is_default: addresses.length === 0
      };

      const { data, error } = await supabase
        .from('addresses')
        .insert(newAddr)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setAddresses([data as Address, ...addresses]);
        setShowAddressForm(false);
        // Clear fields
        setAddrFullName('');
        setAddrPhone('');
        setAddrStreet('');
        setAddrCity('');
        setAddrState('');
        setAddrZip('');
      }
    } catch (err) {
      console.error("Error adding address:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (!error) {
      setAddresses(addresses.filter(addr => addr.id !== id));
    }
  };

  // Calculations for stats
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const orderCount = orders.length;

  // Order status steps tracker mapping
  const statusSteps = [
    { label: 'Pending', icon: Clock },
    { label: 'Processing', icon: Settings },
    { label: 'Packed', icon: Package },
    { label: 'Shipped', icon: Truck },
    { label: 'Out For Delivery', icon: Truck },
    { label: 'Delivered', icon: CheckCircle2 }
  ];

  if (loading && orders.length === 0 && addresses.length === 0) {
    return (
      <div className="min-h-screen pt-28 flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-accent-purple animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-28 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative">
      <div className="bg-mesh"></div>

      {/* Decorative Orb */}
      <div className="absolute top-1/3 left-10 w-96 h-96 rounded-full bg-accent-blue/5 blur-3xl -z-10"></div>

      {/* LEFT SIDEBAR (MetaMask SaaS styled dashboard navigation bar) */}
      <aside className="w-full lg:w-64 glass-panel p-5 shrink-0 flex flex-col gap-6 shadow-glass border border-white/5 h-fit">
        
        {/* User Card info */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-indigo to-accent-purple flex items-center justify-center font-bold text-white text-base">
            {profile?.full_name?.substring(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-white truncate">{profile?.full_name}</span>
            <span className="text-[10px] text-gray-500 truncate">@{profile?.username}</span>
          </div>
        </div>

        {/* Navigation Sidebar Links */}
        <nav className="flex flex-col gap-1.5">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: User },
            { id: 'orders', label: 'My Orders', icon: ShoppingBag },
            { id: 'addresses', label: 'Shipping Addresses', icon: MapPin },
            { id: 'profile', label: 'Profile Settings', icon: Settings }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedOrder(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-blue text-white shadow-neon' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN VIEW CONTENT */}
      <main className="flex-grow w-full flex flex-col gap-6">
        
        {/* TAB 1: SUMMARY DASHBOARD STATS */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            
            {/* Header */}
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-purple" />
                NexaDashboard Overview
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Real-time marketplace balances and metrics</p>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="glass-card p-5 border border-white/5 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Spending</span>
                  <span className="text-xl font-black text-white">${totalSpent.toFixed(2)}</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="glass-card p-5 border border-white/5 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Orders</span>
                  <span className="text-xl font-black text-white">{orderCount} orders</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              <div className="glass-card p-5 border border-white/5 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Wishlisted Items</span>
                  <span className="text-xl font-black text-white">{wishlistCount} items</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
                  <Heart className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* RECENT ORDERS LIST */}
            <div className="glass-panel p-6 border border-white/5 shadow-glass flex flex-col gap-4">
              <h3 className="font-bold text-sm text-white border-b border-white/5 pb-3">Recent Transactions</h3>
              {orders.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {orders.slice(0, 3).map((order) => (
                    <div 
                      key={order.id} 
                      onClick={() => { setSelectedOrder(order); setActiveTab('orders'); }}
                      className="flex justify-between items-center p-3 rounded-lg border border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/5 cursor-pointer transition-all text-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white">Order Reference: {order.id.substring(0, 8).toUpperCase()}</span>
                        <span className="text-[10px] text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-semibold">${Number(order.total_amount).toFixed(2)}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === 'Delivered' 
                            ? 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald' 
                            : order.status === 'Cancelled' 
                              ? 'bg-red-500/10 border border-red-500/20 text-red-500' 
                              : 'bg-accent-blue/10 border border-accent-blue/20 text-accent-blue'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-gray-500">No transactions recorded yet.</div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: MY ORDERS & VISUAL STATUS TRACKER */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-6">
            
            {/* Header */}
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Order Logs</h2>
              <p className="text-xs text-gray-500 mt-0.5">Track your shipped and processing deliveries</p>
            </div>

            {selectedOrder ? (
              /* ORDER DETAIL & STATUS TRACKING FLOW */
              <div className="glass-panel p-6 border border-white/5 shadow-glass flex flex-col gap-6">
                
                {/* Back button */}
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs text-accent-indigo hover:text-accent-purple font-semibold w-fit hover:underline cursor-pointer"
                >
                  &larr; Back to Order Logs
                </button>

                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-white">Order Ref: {selectedOrder.id}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">Logged on: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    selectedOrder.status === 'Delivered' 
                      ? 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald' 
                      : selectedOrder.status === 'Cancelled' 
                        ? 'bg-red-500/10 border border-red-500/20 text-red-500' 
                        : 'bg-accent-blue/10 border border-accent-blue/20 text-accent-blue'
                  }`}>
                    Status: {selectedOrder.status}
                  </span>
                </div>

                {/* VISUAL ORDER TIMELINE (TRACKER) */}
                {selectedOrder.status !== 'Cancelled' && (
                  <div className="flex flex-col gap-4 bg-white/2 border border-white/5 p-5 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live Delivery Track</h4>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mt-2 relative">
                      {statusSteps.map((step, idx) => {
                        const stepIdx = statusSteps.findIndex(s => s.label === selectedOrder.status);
                        const isCompleted = idx <= stepIdx;
                        const isCurrent = idx === stepIdx;

                        return (
                          <div key={idx} className="flex sm:flex-col items-center gap-3 sm:text-center flex-grow">
                            
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                              isCompleted 
                                ? 'bg-accent-indigo border-accent-indigo text-white shadow-neon' 
                                : 'bg-[#09090D] border-white/10 text-gray-500'
                            } ${isCurrent ? 'ring-2 ring-white/20 scale-110' : ''}`}>
                              <step.icon className="w-4 h-4" />
                            </div>
                            
                            <div className="flex flex-col sm:items-center">
                              <span className={`text-[10px] font-bold ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                                {step.label}
                              </span>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items in this order */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purchased Items</h4>
                  <div className="flex flex-col gap-3">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center gap-4 p-3 border border-white/5 rounded-xl text-xs bg-white/2">
                        <div className="flex items-center gap-3 truncate">
                          <img 
                            src={item.product?.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80'} 
                            alt="" 
                            className="w-10 h-10 rounded-lg object-cover bg-[#0c0c14] border border-white/5 shrink-0" 
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80';
                              if (target.src !== fallback) {
                                target.src = fallback;
                              }
                            }}
                          />
                          <span className="font-semibold text-white truncate">{item.product?.name}</span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-gray-500">Qty: {item.quantity}</span>
                          <span className="font-bold text-white">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checkout pricing details summary */}
                <div className="flex flex-col gap-2.5 text-xs text-gray-400 border-t border-white/5 pt-4 max-w-xs ml-auto w-full">
                  <div className="flex justify-between">
                    <span>Tax (12%)</span>
                    <span className="text-white">${Number(selectedOrder.tax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span className="text-white">${Number(selectedOrder.delivery_charge).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2 font-bold">
                    <span className="text-white">Paid amount</span>
                    <span className="text-white">${Number(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>

              </div>
            ) : (
              /* ORDERS LIST VIEW */
              <div className="glass-panel p-6 border border-white/5 shadow-glass flex flex-col gap-4">
                {orders.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {orders.map((order) => (
                      <div 
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="p-4 rounded-xl border border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/5 cursor-pointer transition-all flex justify-between items-center gap-4 text-xs"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-white">Order: #{order.id.substring(0, 8).toUpperCase()}</span>
                          <span className="text-[10px] text-gray-500">Date: {new Date(order.created_at).toLocaleDateString()}</span>
                          <span className="text-[10px] text-gray-500">Items: {order.order_items.length} unique items</span>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="font-bold text-white">${Number(order.total_amount).toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            order.status === 'Delivered' 
                              ? 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald' 
                              : order.status === 'Cancelled' 
                                ? 'bg-red-500/10 border border-red-500/20 text-red-500' 
                                : 'bg-accent-blue/10 border border-accent-blue/20 text-accent-blue'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 flex flex-col gap-3 items-center">
                    <ShoppingBag className="w-12 h-12 text-gray-700" />
                    <p className="text-xs text-gray-500">No orders placed yet.</p>
                    <Link to="/search" className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 shadow-neon cursor-pointer">
                      Shop Products
                    </Link>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* TAB 3: SHIPPING ADDRESSES MANAGEMENT */}
        {activeTab === 'addresses' && (
          <div className="flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Address Ledger</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage default and secondary delivery addresses</p>
              </div>
              <button 
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-neon"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>

            {/* Address insert form */}
            {showAddressForm && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 border border-white/5 shadow-glass"
              >
                <h3 className="font-bold text-xs text-white uppercase tracking-wider mb-4">Add Shipping Address</h3>
                <form onSubmit={handleAddAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Title</label>
                    <input 
                      type="text" required placeholder="Home, Office etc."
                      value={addrTitle} onChange={(e) => setAddrTitle(e.target.value)}
                      className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recipient Name</label>
                    <input 
                      type="text" required placeholder="Full name"
                      value={addrFullName} onChange={(e) => setAddrFullName(e.target.value)}
                      className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</label>
                    <input 
                      type="tel" required placeholder="Phone number"
                      value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)}
                      className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Street Address</label>
                    <input 
                      type="text" required placeholder="Street address detail"
                      value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)}
                      className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">City</label>
                    <input 
                      type="text" required placeholder="City name"
                      value={addrCity} onChange={(e) => setAddrCity(e.target.value)}
                      className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">State</label>
                    <input 
                      type="text" required placeholder="State / Province"
                      value={addrState} onChange={(e) => setAddrState(e.target.value)}
                      className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ZIP Code</label>
                    <input 
                      type="text" required placeholder="Postal ZIP code"
                      value={addrZip} onChange={(e) => setAddrZip(e.target.value)}
                      className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Country</label>
                    <input 
                      type="text" required placeholder="US, IN etc."
                      value={addrCountry} onChange={(e) => setAddrCountry(e.target.value)}
                      className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold border border-white/5 bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 cursor-pointer"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* List addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {addresses.map((addr) => (
                <div key={addr.id} className="glass-card p-5 border border-white/5 relative flex gap-3">
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      {addr.title}
                      {addr.is_default && (
                        <span className="text-[8px] bg-accent-blue/10 border border-accent-blue/20 text-accent-blue font-bold px-1.5 py-0.5 rounded uppercase">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-300 font-semibold">{addr.full_name}</p>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      {addr.street_address}, {addr.city}, {addr.state} - {addr.postal_code}, {addr.country}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1.5">Phone: {addr.phone}</p>
                  </div>
                  
                  {/* Delete button */}
                  <button 
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {addresses.length === 0 && !showAddressForm && (
                <div className="col-span-2 text-center py-16 text-xs text-gray-500">
                  No shipping addresses saved. Click "Add New" to register a delivery destination.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-6">
            
            {/* Header */}
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Identity Settings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Customize your personal profile data and preferences</p>
            </div>

            <div className="glass-panel p-6 border border-white/5 shadow-glass max-w-xl">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider mb-5">Update Profile Information</h3>
              
              {profileSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-xs">
                  Profile updated successfully!
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account ID (Email)</label>
                  <div className="relative flex items-center bg-white/2 border border-white/5 rounded-lg text-gray-500">
                    <Lock className="w-4 h-4 text-gray-600 absolute left-3" />
                    <input 
                      type="text" disabled 
                      value={user?.email || ''} 
                      className="bg-transparent border-none outline-none py-2.5 pl-10 pr-4 text-sm w-full text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" required placeholder="Full Name"
                    value={editFullName} onChange={(e) => setEditFullName(e.target.value)}
                    className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-accent-purple/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Username</label>
                  <input 
                    type="text" required placeholder="Username"
                    value={editUsername} onChange={(e) => setEditUsername(e.target.value)}
                    className="bg-[#09090D] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-accent-purple/50"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-fit ml-auto mt-2 py-2 px-5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 transition-all cursor-pointer shadow-neon"
                >
                  Save Changes
                </button>

              </form>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};
