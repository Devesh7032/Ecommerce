import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  const { 
    items, 
    loading, 
    fetchWishlist, 
    removeItem, 
    moveToCart 
  } = useWishlistStore();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      navigate('/auth');
    }
  }, [user, navigate, fetchWishlist]);

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-accent-purple animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-28 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col gap-8 relative">
      <div className="bg-mesh"></div>

      {/* Decorative Orb */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-accent-purple/5 blur-3xl -z-10"></div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
          My Wishlist
        </h1>
        <p className="text-xs text-gray-500 mt-1">Products saved to buy later or monitor stock updates</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item) => {
            if (!item.product) return null;
            const displayPrice = item.product.sale_price ?? item.product.price;
            const hasDiscount = item.product.sale_price !== null;
            const isOutOfStock = item.product.stock_quantity <= 0;

            return (
              <motion.div 
                key={item.id}
                layout
                className="glass-card overflow-hidden group flex flex-col justify-between h-full relative border border-white/5"
              >
                
                {/* Remove from wishlist button */}
                <button 
                  onClick={() => removeItem(item.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#07070A]/80 border border-white/5 flex items-center justify-center cursor-pointer text-gray-400 hover:text-red-500 hover:border-red-500/25 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link to={`/product/${item.product_id}`} className="block flex-grow">
                  
                  {/* Thumbnail Image */}
                  <div className="w-full aspect-square bg-[#0c0c14] overflow-hidden relative">
                    <img 
                      src={item.product.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80'} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80';
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-[#07070A]/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="px-3 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details information */}
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{item.product.brand}</span>
                    </div>

                    <h3 className="font-semibold text-sm text-gray-200 line-clamp-2 min-h-10">
                      {item.product.name}
                    </h3>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-white text-base">
                        ${displayPrice.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-500 line-through">
                          ${item.product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                </Link>

                {/* Move to Cart Quick Action */}
                <div className="p-4 pt-0">
                  <button 
                    onClick={() => moveToCart(item.id, item.product_id)}
                    disabled={isOutOfStock}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      isOutOfStock 
                        ? 'bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed' 
                        : 'bg-white text-black hover:bg-gray-200 shadow-neon-blue'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Move to Cart
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <Heart className="w-16 h-16 text-gray-700 animate-pulse" />
          <div>
            <h3 className="font-bold text-base text-white">Your Wishlist is Empty</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">No items found in your wishlist. Start adding items you would like to follow.</p>
          </div>
          <Link 
            to="/search" 
            className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-gray-200 cursor-pointer shadow-neon-blue"
          >
            Explore Products
          </Link>
        </div>
      )}

    </div>
  );
};
