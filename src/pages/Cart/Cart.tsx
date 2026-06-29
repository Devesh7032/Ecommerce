import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { 
  Trash2, 
  Heart, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowRight,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  const { 
    items, 
    loading, 
    fetchCart, 
    removeItem, 
    updateQuantity, 
    getTotals 
  } = useCartStore();

  const addWishlistItem = useWishlistStore(state => state.addItem);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      navigate('/auth');
    }
  }, [user, navigate, fetchCart]);

  const handleSaveForLater = async (productId: string, itemId: string) => {
    // 1. Add to wishlist
    await addWishlistItem(productId);
    // 2. Remove from cart
    await removeItem(itemId);
  };

  const { subtotal, tax, delivery, total } = getTotals();

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

      {/* Decorative Orbs */}
      <div className="absolute top-1/4 right-10 w-96 h-96 rounded-full bg-accent-blue/5 blur-3xl -z-10"></div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-accent-indigo" />
          Shopping Cart
        </h1>
        <p className="text-xs text-gray-500 mt-1">Review and manage your pending purchase items</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* CART ITEMS LIST */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => {
              if (!item.product) return null;
              const displayPrice = item.product.sale_price ?? item.product.price;
              const isOutOfStock = item.product.stock_quantity < item.quantity;

              return (
                <motion.div 
                  key={item.id}
                  layout
                  className="glass-card p-4 flex flex-col sm:flex-row gap-4 border border-white/5 relative"
                >
                  {/* Thumbnail Image */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#0c0c14] border border-white/5 shrink-0">
                    <img 
                      src={item.product.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80'} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80';
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                  </div>

                  {/* Item Specs Details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{item.product.brand}</span>
                        <span className="text-sm font-bold text-white">${(displayPrice * item.quantity).toFixed(2)}</span>
                      </div>
                      <Link to={`/product/${item.product_id}`} className="font-semibold text-sm text-gray-200 hover:text-white transition-colors hover:underline block mt-0.5 line-clamp-1">
                        {item.product.name}
                      </Link>
                      <span className="text-[10px] text-gray-500 mt-1 block">Unit price: ${displayPrice.toFixed(2)}</span>
                    </div>

                    {/* Stock Warning alert */}
                    {isOutOfStock && (
                      <div className="my-1.5 flex items-center gap-1.5 text-[10px] text-red-400">
                        <Info className="w-3.5 h-3.5" />
                        Insufficient stock quantity remaining.
                      </div>
                    )}

                    {/* Quantity & Actions Bar */}
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-[#09090D] border border-white/10 rounded-lg">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:text-white text-gray-500 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs text-white font-semibold">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:text-white text-gray-500 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Actions buttons */}
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleSaveForLater(item.product_id, item.id)}
                          className="text-[10px] font-bold text-accent-indigo hover:text-accent-purple flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          Save for Later
                        </button>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>

                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>

          {/* CHECKOUT SUMMARY SUMMARY */}
          <div className="glass-panel p-6 border border-white/5 flex flex-col gap-6 shadow-glass">
            <h3 className="font-bold text-sm text-white border-b border-white/5 pb-3">Order Details</h3>
            
            <div className="flex flex-col gap-3 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (12%)</span>
                <span className="text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="text-white">{delivery === 0 ? 'FREE' : `$${delivery.toFixed(2)}`}</span>
              </div>
              
              {/* Shipping progress indicator */}
              {delivery > 0 && (
                <div className="mt-1.5 p-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-[10px] text-accent-blue">
                  Add <strong className="text-white">${(200 - subtotal).toFixed(2)}</strong> more in products to qualify for Free Shipping.
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-4 flex justify-between items-baseline">
              <span className="font-bold text-sm text-white">Grand Total</span>
              <span className="font-black text-xl text-white">${total.toFixed(2)}</span>
            </div>

            <Link 
              to="/checkout" 
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm cursor-pointer bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-blue text-white shadow-neon flex items-center justify-center gap-2 hover:opacity-95 transition-all text-center"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link to="/search" className="text-xs text-gray-500 hover:text-white transition-colors text-center block hover:underline">
              Continue Shopping
            </Link>
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <ShoppingBag className="w-16 h-16 text-gray-700 animate-bounce" />
          <div>
            <h3 className="font-bold text-base text-white">Your Cart is Empty</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">No items found in your shopping cart. Connect to the catalog and start collecting items.</p>
          </div>
          <Link 
            to="/search" 
            className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-gray-200 cursor-pointer shadow-neon-blue"
          >
            Explore Catalog
          </Link>
        </div>
      )}
    </div>
  );
};
