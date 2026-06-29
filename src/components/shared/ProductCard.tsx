import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sale_price: number | null;
  images: string[];
  rating: number;
  reviews_count: number;
  brand: string;
  stock_quantity: number;
  created_at?: string;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  const addItemToCart = useCartStore(state => state.addItem);
  const wishlistItems = useWishlistStore(state => state.items);
  const addWishlistItem = useWishlistStore(state => state.addItem);
  const removeWishlistItem = useWishlistStore(state => state.removeItem);

  const isInWishlist = wishlistItems.some(item => item.product_id === product.id);
  const wishlistItem = wishlistItems.find(item => item.product_id === product.id);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isInWishlist && wishlistItem) {
      await removeWishlistItem(wishlistItem.id);
    } else {
      await addWishlistItem(product.id);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    await addItemToCart(product.id, 1);
  };

  const displayPrice = product.sale_price ?? product.price;
  const hasDiscount = product.sale_price !== null;
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -8, scale: 1.04 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="glass-card overflow-hidden group flex flex-col justify-between h-full relative"
    >
      <Link to={`/product/${product.id}`} className="block flex-grow">
        
        {/* Wishlist Heart Toggle */}
        <button 
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#07070A]/80 border border-white/5 flex items-center justify-center cursor-pointer text-gray-400 hover:text-red-500 hover:border-red-500/30 hover:bg-[#07070A] transition-all"
        >
          <Heart className={`w-4.5 h-4.5 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Product Image Cover */}
        <div className="w-full aspect-square bg-[#0c0c14] overflow-hidden relative">
          <img 
            src={product.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80'} 
            alt={product.name} 
            loading="lazy"
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
          {hasDiscount && !isOutOfStock && (
            <div className="absolute bottom-3 left-3 bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Sale
            </div>
          )}
        </div>

        {/* Product Info details */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              <span>{product.rating > 0 ? product.rating : 'N/A'}</span>
            </div>
          </div>

          <h3 className="font-semibold text-sm text-gray-200 group-hover:text-white transition-colors line-clamp-2 min-h-10">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-bold text-white text-base">
              ${displayPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

      </Link>

      {/* Action Footer */}
      <div className="p-4 pt-0">
        <button 
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            isOutOfStock 
              ? 'bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed' 
              : 'bg-white text-black hover:bg-gray-200 shadow-neon-blue'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Add to Cart
        </button>
      </div>

    </motion.div>
  );
};
