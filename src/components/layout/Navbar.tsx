import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Search, 
  LogOut, 
  LayoutDashboard, 
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();
  const cartItems = useCartStore(state => state.items);
  const wishlistItems = useWishlistStore(state => state.items);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-7xl z-50 glass-panel px-6 py-3 flex items-center justify-between shadow-neon-blue">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-indigo via-accent-purple to-accent-blue flex items-center justify-center shadow-neon font-bold text-white text-lg tracking-wider transition-transform group-hover:scale-105">
          N
        </div>
        <span className="font-extrabold text-xl tracking-tight text-gradient hidden sm:block">
          NexaShop
        </span>
      </Link>

      {/* Search Bar - MetaMask/Stripe SaaS Style */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-80 focus-within:border-accent-purple/50 focus-within:bg-white/10 transition-all duration-200">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search collections, brands, items..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-500 text-white"
        />
      </form>

      {/* Right Side Icons */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Link to="/search" className="md:hidden text-gray-400 hover:text-white transition-colors">
          <Search className="w-5 h-5" />
        </Link>

        {/* Wishlist */}
        <Link to="/wishlist" className="relative text-gray-400 hover:text-white transition-colors">
          <Heart className="w-5 h-5" />
          {wishlistCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="absolute -top-1.5 -right-2 bg-gradient-to-r from-pink-500 to-accent-purple text-[10px] font-bold text-white w-4.5 h-4.5 rounded-full flex items-center justify-center"
            >
              {wishlistCount}
            </motion.span>
          )}
        </Link>

        {/* Shopping Cart */}
        <Link to="/cart" className="relative text-gray-400 hover:text-white transition-colors">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="absolute -top-1.5 -right-2 bg-gradient-to-r from-accent-blue to-accent-indigo text-[10px] font-bold text-white w-4.5 h-4.5 rounded-full flex items-center justify-center"
            >
              {cartCount}
            </motion.span>
          )}
        </Link>

        {/* Profile Dropdown / Login Button */}
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full border border-white/20 overflow-hidden flex items-center justify-center cursor-pointer hover:border-accent-purple/75 transition-all bg-white/5"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-300" />
              )}
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileOpen && (
                <>
                  {/* Overlay click to close */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 glass-panel p-2 shadow-glass border border-white/10 z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                      <p className="text-sm font-semibold text-white truncate">{profile?.full_name || 'My Account'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    <Link 
                      to="/dashboard" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      User Dashboard
                    </Link>

                    {profile?.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-yellow-500/80 hover:text-yellow-400 hover:bg-yellow-500/5 rounded-lg transition-all"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}

                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition-all text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link 
            to="/auth" 
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow-neon hover:shadow-glass transition-all hover:scale-105"
          >
            Connect
          </Link>
        )}

        {/* Mobile Menu Toggle */}
        <button 
          className="text-gray-400 hover:text-white md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-0 right-0 glass-panel p-4 flex flex-col gap-4 border border-white/10 md:hidden z-40"
          >
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 w-full focus-within:border-accent-purple/50">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500"
              />
            </form>
            <div className="flex flex-col gap-2">
              <Link to="/search" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white py-1">Explore Products</Link>
              <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white py-1">Wishlist</Link>
              <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white py-1">Cart</Link>
              {user && (
                <>
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white py-1">Dashboard</Link>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-yellow-500/80 hover:text-yellow-400 py-1">Admin Panel</Link>
                  )}
                  <button onClick={handleSignOut} className="text-red-400 hover:text-red-300 py-1 text-left">Sign Out</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
