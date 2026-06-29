import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ProductCard, type Product } from '../../components/shared/ProductCard';
import { 
  Search as SearchIcon, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search parameters from URL
  const urlQuery = searchParams.get('q') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlSort = searchParams.get('sort') || 'latest';
  const urlDeals = searchParams.get('deals') === 'true';

  // Component State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [searchVal, setSearchVal] = useState(urlQuery);
  const [categoryVal, setCategoryVal] = useState(urlCategory);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [sortVal, setSortVal] = useState(urlSort);
  const [dealsVal, setDealsVal] = useState(urlDeals);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 8;

  // Brands list (derived dynamically or static from our categories brands)
  const brandsList = [
    'Apple', 'Samsung', 'Sony', 'LG', 'TCL', 'Hisense', 'Bose', 'Sennheiser', 'JBL', 'Sonos', 
    'Anker', 'Dell', 'Lenovo', 'HP', 'ASUS', 'Razer', 'Logitech', 'Corsair', 'Nintendo', 
    'Microsoft', 'Nike', 'Adidas', 'Puma', 'New Balance', 'Timberland', 'Dr. Martens', 
    'Rolex', 'Seiko', 'Omega', 'Casio', 'Garmin', 'L\'Oreal', 'Estée Lauder', 'Ordinary', 
    'CeraVe', 'Dyson', 'Chanel', 'O\'Reilly', 'Penguin', 'HarperCollins', 'Macmillan', 
    'Pearson', 'Under Armour', 'Wilson', 'Decathlon', 'Spalding', 'Yeti', 'Bowflex', 
    'IKEA', 'Herman Miller', 'Ashley', 'West Elm', 'Steelcase', 'Wüsthof', 'Le Creuset', 
    'KitchenAid', 'Instant Pot', 'Breville', 'iRobot', 'Philips', 'Xiaomi', 'Whole Foods', 
    'Kirkland', 'Trader Joe\'s', 'Heinz', 'Nestle'
  ];

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('id, name, slug');
      if (data) setCategories(data as Category[]);
    };
    fetchCats();
  }, []);

  // Load popular fallback products
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*, categories(slug, name)')
          .order('reviews_count', { ascending: false })
          .limit(4);
        if (data) setPopularProducts(data as unknown as Product[]);
      } catch (err) {
        console.error("Error loading popular products fallback:", err);
      }
    };
    fetchPopular();
  }, []);

  // Update states if URL search params change
  useEffect(() => {
    setSearchVal(urlQuery);
    setCategoryVal(urlCategory);
    setSortVal(urlSort);
    setDealsVal(urlDeals);
    setCurrentPage(1); // Reset to page 1 on new search
  }, [urlQuery, urlCategory, urlSort, urlDeals]);

  // Fetch products based on filters, sorting, and pagination
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Base select query
        let query = supabase
          .from('products')
          .select('*, categories!inner(slug, name)', { count: 'exact' });

        // Search text filter with synonym expansions
        if (searchVal.trim()) {
          const term = searchVal.trim().toLowerCase();
          let orFilter = `name.ilike.%${term}%,brand.ilike.%${term}%,description.ilike.%${term}%`;
          
          if (term === 'tv') {
            orFilter += `,name.ilike.%television%,description.ilike.%television%`;
          } else if (term === 'television' || term === 'televisions') {
            orFilter += `,name.ilike.%tv%,description.ilike.%tv%`;
          } else if (term === 'iphone' || term === 'iphones') {
            orFilter += `,name.ilike.%iphone%,brand.ilike.%apple%`;
          } else if (term === 'samsung') {
            orFilter += `,brand.ilike.%samsung%`;
          }
          query = query.or(orFilter);
        }

        // Category filter
        if (categoryVal) {
          query = query.eq('categories.slug', categoryVal);
        }

        // Deals filter
        if (dealsVal) {
          query = query.not('sale_price', 'is', null);
        }

        // Brand filter
        if (selectedBrand) {
          query = query.eq('brand', selectedBrand);
        }

        // Price filters
        if (minPrice > 0) {
          query = query.gte('price', minPrice);
        }
        if (maxPrice < 1000) {
          query = query.lte('price', maxPrice);
        }

        // Sorting
        if (sortVal === 'price_asc') {
          query = query.order('price', { ascending: true });
        } else if (sortVal === 'price_desc') {
          query = query.order('price', { ascending: false });
        } else if (sortVal === 'rating') {
          query = query.order('rating', { ascending: false });
        } else if (sortVal === 'reviews') {
          query = query.order('reviews_count', { ascending: false });
        } else {
          // default latest
          query = query.order('created_at', { ascending: false });
        }

        // Pagination
        const fromIdx = (currentPage - 1) * itemsPerPage;
        const toIdx = fromIdx + itemsPerPage - 1;
        query = query.range(fromIdx, toIdx);

        const { data, count: countVal, error } = await query;

        if (error) throw error;
        
        setProducts(data as unknown as Product[] || []);
        setTotalCount(countVal || 0);

      } catch (err) {
        console.error("Error searching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchVal, categoryVal, sortVal, dealsVal, selectedBrand, minPrice, maxPrice, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (searchVal) prev.set('q', searchVal);
      else prev.delete('q');
      return prev;
    });
    setCurrentPage(1);
  };

  const handleCategoryChange = (slug: string) => {
    setCategoryVal(slug);
    setSearchParams(prev => {
      if (slug) prev.set('category', slug);
      else prev.delete('category');
      return prev;
    });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchVal('');
    setCategoryVal('');
    setSelectedBrand('');
    setMinPrice(0);
    setMaxPrice(1000);
    setSortVal('latest');
    setDealsVal(false);
    setSearchParams({});
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="w-full min-h-screen pt-28 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col gap-8 relative">
      <div className="bg-mesh"></div>

      {/* Decorative Orbs */}
      <div className="absolute top-1/3 left-10 w-96 h-96 rounded-full bg-accent-indigo/5 blur-3xl animate-pulse-glow -z-10"></div>
      
      {/* Header Search Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent-purple" />
            Explore NexaCatalog
          </h1>
          <p className="text-xs text-gray-500 mt-1">Discover, filter, and customize your marketplace query</p>
        </div>

        {/* Global Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 w-full md:w-96 focus-within:border-accent-purple/50 focus-within:bg-white/10 transition-all duration-200">
          <SearchIcon className="w-4 h-4 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search catalog..." 
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500"
          />
          <button type="submit" className="hidden" />
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR FILTERS (MetaMask SaaS styled box) */}
        <aside className="w-full lg:w-64 glass-panel p-6 shrink-0 flex flex-col gap-6 shadow-glass border border-white/5">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4.5 h-4.5 text-accent-indigo" />
              Search Filters
            </h3>
            <button 
              onClick={resetFilters}
              className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Categories select list */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</h4>
            <select 
              value={categoryVal} 
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-[#09090D] border border-white/10 rounded-lg p-2 text-xs text-gray-300 outline-none w-full focus:border-accent-purple/50"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Sorting selection list */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sort By</h4>
            <select 
              value={sortVal} 
              onChange={(e) => setSortVal(e.target.value)}
              className="bg-[#09090D] border border-white/10 rounded-lg p-2 text-xs text-gray-300 outline-none w-full focus:border-accent-purple/50"
            >
              <option value="latest">Newest Drops</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="reviews">Most Popular</option>
            </select>
          </div>

          {/* Brands list */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brand</h4>
            <select 
              value={selectedBrand} 
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-[#09090D] border border-white/10 rounded-lg p-2 text-xs text-gray-300 outline-none w-full focus:border-accent-purple/50"
            >
              <option value="">All Brands</option>
              {brandsList.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Price Range Limits */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price Range</h4>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="Min" 
                value={minPrice || ''}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="bg-[#09090D] border border-white/10 rounded-lg p-1.5 text-xs text-white outline-none w-1/2 text-center"
              />
              <span className="text-gray-600">-</span>
              <input 
                type="number" 
                placeholder="Max" 
                value={maxPrice || ''}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="bg-[#09090D] border border-white/10 rounded-lg p-1.5 text-xs text-white outline-none w-1/2 text-center"
              />
            </div>
          </div>

          {/* Deals Checkbox toggle */}
          <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={dealsVal} 
              onChange={(e) => setDealsVal(e.target.checked)}
              className="rounded bg-[#09090D] border-white/10 text-accent-indigo focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            Only Flash Deals / Sale items
          </label>
        </aside>

        {/* RESULTS GRID AREA */}
        <main className="flex-grow w-full flex flex-col gap-6">
          
          <div className="flex justify-between items-center text-xs text-gray-500 border-b border-white/5 pb-3">
            <span>Showing <strong className="text-white">{products.length}</strong> of <strong className="text-white">{totalCount}</strong> results</span>
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sorted by <span className="text-white capitalize">{sortVal.replace('_', ' ')}</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 rounded-xl bg-white/5 animate-pulse"></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>

              {/* PAGINATION INTERFACES */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 border-t border-white/5 pt-6">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-2 rounded-lg border border-white/5 hover:border-white/10 bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-400">
                    Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
                  </span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-2 rounded-lg border border-white/5 hover:border-white/10 bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-10 w-full">
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4 border border-white/5 bg-white/2 rounded-2xl p-6">
                <SlidersHorizontal className="w-10 h-10 text-gray-600 animate-pulse" />
                <div>
                  <h3 className="font-bold text-base text-white">No Products Found</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-light leading-relaxed">No items matched your current query combination. Try removing filters or modifying your search string.</p>
                </div>
                <button 
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>

              {popularProducts.length > 0 && (
                <div className="flex flex-col gap-6 mt-4 border-t border-white/5 pt-8">
                  <h3 className="text-base font-black text-white tracking-tight uppercase flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent-purple" />
                    Try these popular products
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {popularProducts.map((prod) => (
                      <ProductCard key={prod.id} product={prod} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

      </div>
    </div>
  );
};
