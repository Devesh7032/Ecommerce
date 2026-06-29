import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ProductCard, type Product } from '../../components/shared/ProductCard';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  ChevronRight, 
  ShieldAlert, 
  Award,
  Truck,
  MessageSquare,
  Sparkles,
  X,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Settings
} from 'lucide-react';
import { analyzeProductWithGemini, type ProductAnalysisData } from '../../services/gemini';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  } | null;
}

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  // States
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [zoomStyle, setZoomStyle] = useState({ backgroundImage: '', backgroundPosition: '0% 0%', display: 'none' });

  // Add Review Form States
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Cart & Wishlist Actions
  const addItemToCart = useCartStore(state => state.addItem);
  const wishlistItems = useWishlistStore(state => state.items);
  const addWishlistItem = useWishlistStore(state => state.addItem);
  const removeWishlistItem = useWishlistStore(state => state.removeItem);

  const isInWishlist = wishlistItems.some(item => item.product_id === id);
  const wishlistItem = wishlistItems.find(item => item.product_id === id);

  // Gemini Product Analysis States
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<ProductAnalysisData | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [tempKey, setTempKey] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'proscons' | 'competitors' | 'verdict'>('overview');

  const runAnalysis = async (keyToUse: string) => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const data = await analyzeProductWithGemini(product, keyToUse);
      setAnalysisData(data);
      setAnalysisError(null);
    } catch (err: any) {
      setAnalysisError(err.message || 'An error occurred during analysis.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleProductAnalysis = async () => {
    setAnalysisOpen(true);
    if (analysisData) return;

    const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
    const currentKey = envKey || apiKey;

    if (!currentKey) {
      return;
    }

    await runAnalysis(currentKey);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = tempKey.trim();
    if (!cleanKey) return;
    localStorage.setItem('gemini_api_key', cleanKey);
    setApiKey(cleanKey);
    runAnalysis(cleanKey);
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setAnalysisData(null);
    setAnalysisError(null);
  };

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // 1. Fetch product details
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('*, categories(*)')
          .eq('id', id)
          .single();

        if (prodErr || !prodData) {
          throw new Error("Product not found");
        }

        setProduct(prodData);
        if (prodData.images && prodData.images.length > 0) {
          setActiveImage(prodData.images[0]);
        }

        // 2. Fetch related products (same category)
        if (prodData.category_id) {
          const { data: relData } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', prodData.category_id)
            .neq('id', id)
            .limit(4);
          setRelatedProducts(relData as unknown as Product[] || []);
        }

        // 3. Fetch reviews
        const { data: revData } = await supabase
          .from('reviews')
          .select('*, profiles(username, full_name, avatar_url)')
          .eq('product_id', id)
          .order('created_at', { ascending: false });
        setReviews(revData as unknown as Review[] || []);

      } catch (err) {
        console.error("Error loading product detail page:", err);
        navigate('/search');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, navigate]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      backgroundImage: `url(${activeImage})`,
      backgroundPosition: `${x}% ${y}%`,
      display: 'block'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle(prev => ({ ...prev, display: 'none' }));
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isInWishlist && wishlistItem) {
      await removeWishlistItem(wishlistItem.id);
    } else if (id) {
      await addWishlistItem(id);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      await addItemToCart(id, 1);
    }
  };

  // Submit Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSubmittingReview(true);
    setReviewError(null);

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          product_id: id,
          rating: newRating,
          comment: newComment.trim()
        })
        .select('*, profiles(username, full_name, avatar_url)')
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("You have already reviewed this product.");
        }
        throw error;
      }

      if (data) {
        setReviews([data as unknown as Review, ...reviews]);
        setNewComment('');
        
        // Refresh product to get updated average rating (calculated by DB trigger)
        const { data: updatedProduct } = await supabase
          .from('products')
          .select('*, categories(*)')
          .eq('id', id)
          .single();
        if (updatedProduct) {
          setProduct(updatedProduct);
        }
      }
    } catch (err: any) {
      setReviewError(err.message || 'Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-accent-purple animate-spin"></div>
      </div>
    );
  }

  if (!product) return null;

  const displayPrice = product.sale_price ?? product.price;
  const hasDiscount = product.sale_price !== null;
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="w-full min-h-screen pt-28 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col gap-12 relative">
      <div className="bg-mesh"></div>

      {/* Breadcrumb Path */}
      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/search" className="hover:text-white transition-colors">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/search?category=${product.categories?.slug}`} className="hover:text-white transition-colors">
          {product.categories?.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-300 truncate max-w-32 sm:max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        
        {/* LEFT GALLERY PANEL */}
        <div className="flex flex-col gap-4">
          {/* Main image with zoom trigger */}
          <div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full aspect-square bg-[#0c0c14] border border-white/5 rounded-2xl overflow-hidden relative cursor-zoom-in"
          >
            <img 
              src={activeImage || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80'} 
              alt={product.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                const fallback = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80';
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            {/* Zoom overlay wrapper */}
            <div 
              style={zoomStyle}
              className="absolute inset-0 bg-no-repeat bg-cover pointer-events-none rounded-2xl"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-[#07070A]/70 backdrop-blur-xs flex items-center justify-center">
                <span className="px-4 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider">
                  Out Of Stock
                </span>
              </div>
            )}
          </div>

          {/* Gallery Thumbnails List */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {product.images.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border bg-[#0c0c14] shrink-0 cursor-pointer transition-all ${
                    activeImage === img ? 'border-accent-purple shadow-neon' : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <img 
                    src={img || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80'} 
                    alt="" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80';
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT INFO DETAILS */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-accent-indigo uppercase tracking-widest">
              {product.brand}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {product.name}
            </h1>
            
            {/* Review stars & count */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
              <div className="flex items-center text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${
                      i < Math.round(product.rating) ? 'fill-yellow-500' : 'text-gray-600'
                    }`} 
                  />
                ))}
              </div>
              <span className="text-white font-semibold">{product.rating}</span>
              <span>•</span>
              <a href="#reviews" className="hover:text-white hover:underline transition-all">
                {product.reviews_count} Customer reviews
              </a>
            </div>
          </div>

          {/* Prices block */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-black text-white">
              ${displayPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
            {hasDiscount && (
              <span className="text-[10px] font-bold text-accent-emerald bg-accent-emerald/10 border border-accent-emerald/20 px-2 py-0.5 rounded-full uppercase ml-auto">
                Save {Math.round(((product.price - product.sale_price!) / product.price) * 100)}%
              </span>
            )}
          </div>

          <p className="text-sm text-gray-400 leading-relaxed">
            {product.description}
          </p>

          {/* Action CTAs */}
          <div className="flex gap-4">
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-grow py-3 px-6 rounded-xl font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${
                isOutOfStock 
                  ? 'bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-200 shadow-neon-blue'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
            <button 
              onClick={handleWishlistToggle}
              className={`p-3 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                isInWishlist 
                  ? 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                  : 'border-white/5 bg-white/5 text-gray-400 hover:text-white hover:border-white/10'
              }`}
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-red-500' : ''}`} />
            </button>
            <button 
              onClick={handleProductAnalysis}
              className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-white transition-all flex items-center justify-center cursor-pointer"
              title="AI Product Analysis"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
            </button>
          </div>

          {/* Delivery & Warranty tags */}
          <div className="grid grid-cols-3 gap-4 border-t border-b border-white/5 py-4 my-2 text-center text-xs text-gray-400">
            <div className="flex flex-col items-center gap-1.5">
              <Truck className="w-4.5 h-4.5 text-accent-indigo" />
              <span>Free Delivery over $200</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-accent-purple" />
              <span>1 Year Warranty</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <MessageSquare className="w-4.5 h-4.5 text-accent-emerald" />
              <span>Verifiable Reviews</span>
            </div>
          </div>

          {/* SPECIFICATIONS LIST (attributes JSONB) */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Specifications</h3>
              <div className="glass-panel overflow-hidden border border-white/5 text-xs">
                {Object.entries(product.attributes).map(([key, val]: [string, any], idx) => (
                  <div 
                    key={key} 
                    className={`flex justify-between p-3 ${
                      idx % 2 === 0 ? 'bg-white/2' : 'bg-transparent'
                    } border-b border-white/5 last:border-none`}
                  >
                    <span className="text-gray-500 capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-white font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="flex flex-col gap-6 border-t border-white/5 pt-10">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-accent-purple" />
            Similar Collections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* REVIEWS & SUBMISSION PANEL */}
      <section id="reviews" className="flex flex-col gap-8 border-t border-white/5 pt-10 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Customer Feedbacks</h2>
            <p className="text-xs text-gray-500 mt-1">Read reviews from purchasers of this item</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Submit Review Form (Auth only) */}
          <div className="glass-panel p-6 border border-white/5">
            <h3 className="font-bold text-sm text-white mb-4">Add Your Review</h3>
            {user ? (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                
                {/* Rating selection stars */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="text-gray-600 hover:text-yellow-500 transition-colors cursor-pointer"
                      >
                        <Star className={`w-6 h-6 ${star <= newRating ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Review Comment</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Write details of your experience with this product..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-[#09090D] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 outline-none focus:border-accent-purple/50 resize-none w-full"
                  />
                </div>

                {reviewError && (
                  <p className="text-[10px] text-red-400 font-semibold">{reviewError}</p>
                )}

                <button 
                  type="submit" 
                  disabled={submittingReview || !newComment.trim()}
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex justify-center items-center"
                >
                  {submittingReview ? (
                    <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin"></div>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 flex flex-col gap-3">
                <ShieldAlert className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-xs text-gray-500">You must be signed in to leave reviews.</p>
                <Link to="/auth" className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-white w-fit mx-auto transition-all">
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev.id} className="glass-card p-5 border border-white/5 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    
                    {/* User profile identifier */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-xs text-gray-300 font-bold uppercase">
                        {rev.profiles?.avatar_url ? (
                          <img src={rev.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          rev.profiles?.username?.substring(0, 2) || 'US'
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">
                          {rev.profiles?.full_name || 'Anonymous Purchaser'}
                        </span>
                        <span className="text-[9px] text-gray-600">
                          @{rev.profiles?.username || 'anonymous'}
                        </span>
                      </div>
                    </div>

                    {/* Stars and Date */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${
                              i < rev.rating ? 'fill-yellow-500' : 'text-gray-600'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-600">
                        {new Date(rev.created_at).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>

                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed font-light">
                    {rev.comment}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-16 flex flex-col gap-2">
                <p className="text-xs text-gray-500">No reviews yet for this product.</p>
                <p className="text-[10px] text-gray-600">Be the first to share your thoughts!</p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* AI PRODUCT ANALYSIS MODAL */}
      {analysisOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto glass-panel border border-white/10 rounded-2xl flex flex-col p-6 sm:p-8 bg-[#09090e]/95 text-white shadow-2xl">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                <h3 className="font-bold text-lg text-white">AI Product Analysis</h3>
              </div>
              <button 
                onClick={() => setAnalysisOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            {!apiKey && !import.meta.env.VITE_GEMINI_API_KEY ? (
              /* API Key Prompt Screen */
              <div className="py-8 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-5">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">Gemini API Key Required</h4>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    This premium feature uses Google Gemini AI to analyze product specifications, reviews, and market alternatives directly in your browser.
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Your key is saved locally in your browser and is never sent to our servers.
                  </p>
                </div>
                <form onSubmit={handleSaveKey} className="w-full flex flex-col gap-3">
                  <input 
                    type="password"
                    required
                    placeholder="Enter Google Gemini API Key"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500/50 w-full text-center"
                  />
                  <div className="flex flex-col gap-2">
                    <button 
                      type="submit"
                      className="py-2.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 transition-all cursor-pointer"
                    >
                      Save Key & Analyze Product
                    </button>
                    <a 
                      href="https://aistudio.google.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-purple-400 hover:underline"
                    >
                      Get a free API Key from Google AI Studio →
                    </a>
                  </div>
                </form>
              </div>
            ) : analysisLoading ? (
              /* Loading Spinner Scanner */
              <div className="py-20 flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-purple-500/10 border-t-purple-500 animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">AI Engine Running Analysis...</p>
                  <p className="text-xs text-gray-500 mt-1 animate-pulse">Querying Gemini 2.5 Flash spec-sheets...</p>
                </div>
              </div>
            ) : analysisError ? (
              /* Error Screen */
              <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <div>
                  <h4 className="font-bold text-base text-white">Analysis Failed</h4>
                  <p className="text-xs text-red-400/80 mt-2 font-mono break-all">{analysisError}</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => runAnalysis(apiKey || (import.meta.env.VITE_GEMINI_API_KEY as string))}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
                  >
                    Retry
                  </button>
                  {apiKey && (
                    <button 
                      onClick={handleClearKey}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      Reset API Key
                    </button>
                  )}
                </div>
              </div>
            ) : analysisData ? (
              /* Success / Report Display Screen */
              <div className="flex flex-col gap-6">
                
                {/* Tab Selectors */}
                <div className="flex border-b border-white/5 pb-2 overflow-x-auto gap-2">
                  {[
                    { id: 'overview', label: 'Overview & Specs' },
                    { id: 'proscons', label: 'Pros & Cons' },
                    { id: 'competitors', label: 'Competitors' },
                    { id: 'verdict', label: 'AI Verdict' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === tab.id 
                          ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Panels */}
                <div className="min-h-[350px]">
                  {activeTab === 'overview' && (
                    <div className="flex flex-col gap-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Brand & Category</span>
                          <span className="text-sm font-semibold text-white block mt-1">{product.brand} • {product.categories?.name}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-6">
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Launch Year</span>
                            <span className="text-sm font-semibold text-white block mt-1">{analysisData.overview.launch_year}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Manufacture Origin</span>
                            <span className="text-sm font-semibold text-white block mt-1">{analysisData.overview.origin_country}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">Executive Summary</h4>
                        <p className="text-xs text-gray-300 leading-relaxed font-light">{analysisData.overview.summary}</p>
                      </div>

                      <div className="flex flex-col gap-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">Technical Specifications</h4>
                        <div className="rounded-xl border border-white/5 overflow-hidden text-xs">
                          {analysisData.specs.length > 0 ? (
                            analysisData.specs.map((spec, idx) => (
                              <div 
                                key={idx} 
                                className={`flex justify-between p-3 border-b border-white/5 last:border-none ${
                                  idx % 2 === 0 ? 'bg-white/2' : 'bg-transparent'
                                }`}
                              >
                                <span className="text-gray-400 font-medium capitalize">{spec.name}</span>
                                <span className="text-white font-semibold">{spec.value}</span>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">No specifications found.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'proscons' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pros Column */}
                      <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col gap-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4" />
                          Key Advantages
                        </h4>
                        <ul className="flex flex-col gap-2.5">
                          {analysisData.pros.map((pro, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start gap-2 leading-relaxed">
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Cons Column */}
                      <div className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/10 flex flex-col gap-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                          <ThumbsDown className="w-4 h-4" />
                          Limitations
                        </h4>
                        <ul className="flex flex-col gap-2.5">
                          {analysisData.cons.map((con, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start gap-2 leading-relaxed">
                              <span className="text-rose-400 mt-0.5">•</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === 'competitors' && (
                    <div className="flex flex-col gap-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">Market Alternatives</h4>
                      <div className="rounded-xl border border-white/5 overflow-hidden text-xs">
                        <div className="grid grid-cols-3 bg-white/5 p-3 font-bold border-b border-white/5 text-gray-400">
                          <span>Alternative Model</span>
                          <span>Est. Price</span>
                          <span>AI Comparison & Differentiator</span>
                        </div>
                        {analysisData.competitors.length > 0 ? (
                          analysisData.competitors.map((comp, idx) => (
                            <div key={idx} className="grid grid-cols-3 p-3 border-b border-white/5 last:border-none hover:bg-white/2 transition-colors">
                              <span className="text-white font-semibold">{comp.name}</span>
                              <span className="text-purple-400 font-bold">{comp.price}</span>
                              <span className="text-gray-300 font-light leading-relaxed">{comp.comparison}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">No competitors listed.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'verdict' && (
                    <div className="flex flex-col gap-6 items-center py-6">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">AI Spec Rating</span>
                        <div className="flex items-center gap-1.5 text-2xl text-yellow-500 font-black">
                          <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                          <span>{analysisData.verdict.rating.toFixed(1)} / 5.0</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Value For Money</span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300 block w-fit mx-auto mt-2 capitalize">
                            {analysisData.verdict.value_for_money}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Purchase Standing</span>
                          <span className="text-xs text-gray-300 block mt-2 font-medium">Recommended for target use-cases</span>
                        </div>
                      </div>

                      <div className="p-5 rounded-xl bg-purple-500/5 border border-purple-500/10 w-full text-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">Final Recommendation</h4>
                        <p className="text-xs text-gray-300 leading-relaxed font-light max-w-2xl mx-auto">
                          {analysisData.verdict.recommendation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with Reset Key button */}
                {apiKey && (
                  <div className="border-t border-white/5 pt-4 flex justify-between items-center text-[10px] text-gray-500">
                    <span>Gemini API Key active from local storage.</span>
                    <button 
                      onClick={handleClearKey}
                      className="text-red-400 hover:text-red-300 hover:underline cursor-pointer transition-all"
                    >
                      Clear Saved API Key
                    </button>
                  </div>
                )}
              </div>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
};
