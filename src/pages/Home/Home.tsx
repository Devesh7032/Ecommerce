import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ProductCard, type Product } from '../../components/shared/ProductCard';
import { NexaFox } from '../../components/shared/NexaFox';
import { useScroll, useTransform, useSpring, motion } from 'framer-motion';
import { 
  ArrowRight, 
  ChevronRight,
  ShoppingBag
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  // Database catalog product states
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);

  // Scroll animations values
  const { scrollYProgress } = useScroll();

  // Responsive scaling for mascot coordinates
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const coordScale = isMobile ? 0.35 : 1;

  // Mascot scroll coordinates relative to screen width/height (vw/vh) for absolute scaling
  // Matches coordinates of mascot positions in the MetaMask Screenshots
  const mascotXRaw = useTransform(
    scrollYProgress,
    [0, 0.22, 0.45, 0.65, 0.85, 1.0],
    [
      0,                            // Section 1: Hero (Centered on large title)
      0,                            // Section 2: Mockup (Sits on bottom center of phone mockup)
      0,                            // Section 3: Curation Grid (Centered in gap between Left & Right cards)
      -25 * coordScale,             // Section 4: Shopping Guide (Left column spacer)
      29 * coordScale,              // Section 5: Catalog (Top-right corner pointing to grid)
      29 * coordScale
    ]
  );

  const mascotYRaw = useTransform(
    scrollYProgress,
    [0, 0.22, 0.45, 0.65, 0.85, 1.0],
    [
      5 * coordScale,               // Section 1: Hero
      23 * coordScale,              // Section 2: Mockup (Resting on bottom edge of phone mockup)
      -2 * coordScale,              // Section 3: Curation Grid
      12 * coordScale,              // Section 4: Shopping Guide
      -23 * coordScale,             // Section 5: Catalog
      -23 * coordScale
    ]
  );

  const mascotScaleRaw = useTransform(
    scrollYProgress,
    [0, 0.22, 0.45, 0.65, 0.85, 1.0],
    [
      1.75,  // Section 1: Hero (Huge fox mascot visual anchor)
      0.95,  // Section 2: Mockup (Shorter, aligned with phone mockup scale)
      1.15,  // Section 3: Curation Grid
      0.95,  // Section 4: Guide
      0.85,  // Section 5: Catalog
      0.85
    ]
  );

  const mascotRotateRaw = useTransform(
    scrollYProgress,
    [0, 0.22, 0.45, 0.65, 0.85, 1.0],
    [
      0,    // Hero
      0,    // Mockup
      0,    // Curation Grid
      -5,   // Guide
      -15,  // Catalog
      -15
    ]
  );

  // Apply spring physics for extra elastic fluid travel motion
  const springConfig = { damping: 30, stiffness: 85, mass: 0.9 };
  const mascotX = useSpring(mascotXRaw, springConfig);
  const mascotY = useSpring(mascotYRaw, springConfig);
  const mascotScale = useSpring(mascotScaleRaw, springConfig);
  const mascotRotate = useSpring(mascotRotateRaw, springConfig);

  // Map spring outputs to responsive Viewport Units to avoid text overlaps on any resolution
  const xViewport = useTransform(mascotX, (val) => `${val}vw`);
  const yViewport = useTransform(mascotY, (val) => `${val}vh`);

  // Section 4: 3D perspective tilting scroll values for typography headers ("THE EVERYTHING CART")
  const textRotateX = useTransform(scrollYProgress, [0.45, 0.65], [0, 45]);
  const textRotateY = useTransform(scrollYProgress, [0.45, 0.65], [0, 20]);
  const textScale = useTransform(scrollYProgress, [0.45, 0.65], [1, 0.9]);
  
  // Section 2: Phone rising and tilting scroll values
  const phoneTranslateY = useTransform(scrollYProgress, [0, 0.22], [400, 0]);
  const phoneRotateX = useTransform(scrollYProgress, [0, 0.22], [30, 0]);
  const phoneScale = useTransform(scrollYProgress, [0, 0.22], [0.8, 1]);

  // Load products
  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        setLoading(true);
        const { data: prodData } = await supabase.from('products').select('*').limit(4);
        setProducts(prodData as unknown as Product[] || []);
      } catch (err) {
        console.error("Error fetching homepage catalog data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogData();
  }, []);

  // Track active scroll section for side dot indicators
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      const windowHeight = window.innerHeight;
      const index = Math.round(scrollPos / windowHeight);
      setActiveSection(index);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full bg-[#FAF5F0] text-[#1C0D3F] overflow-x-hidden min-h-screen relative selection:bg-orange-500/20">
      
      {/* CSS Styles for background perspective grids and marquee banners */}
      <style>{`
        @keyframes grid-scroll {
          from { background-position: 0 0; }
          to { background-position: 0 40px; }
        }
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee-scroll 24s linear infinite; }
        .grid-bg-overlay {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(249, 115, 22, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(249, 115, 22, 0.03) 1px, transparent 1px);
          transform: perspective(600px) rotateX(55deg);
          transform-origin: top center;
          animation: grid-scroll 18s linear infinite;
        }
      `}</style>

      {/* Grid Overlay for Visual Depth */}
      <div className="fixed top-0 left-0 w-full h-[70vh] grid-bg-overlay -z-10 pointer-events-none opacity-80" />

      {/* Side Dots Scroll indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-40">
        {[0, 1, 2, 3, 4].map((idx) => (
          <button 
            key={idx}
            onClick={() => window.scrollTo({ top: idx * window.innerHeight, behavior: 'smooth' })}
            className={`w-3.5 h-3.5 rounded-full border border-orange-500/20 transition-all flex items-center justify-center cursor-pointer ${
              activeSection === idx ? 'bg-orange-500 scale-125 border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-transparent hover:bg-orange-500/10'
            }`}
            aria-label={`Scroll to section ${idx + 1}`}
          >
            {activeSection === idx && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </button>
        ))}
      </div>

      {/* GLOBAL FIXED MASCOT CONTAINER */}
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        style={{
          x: xViewport,
          y: yViewport,
          scale: mascotScale,
          rotate: mascotRotate
        }}
      >
        <NexaFox size={isMobile ? 240 : 400} className="pointer-events-auto" />
      </motion.div>

      {/* SECTION 1: HERO STORYTELLING */}
      <section className="h-screen w-full flex items-center justify-center relative px-6 z-10 select-none overflow-hidden">
        
        {/* Colorful 3D abstract illustration elements in the backdrop (MetaMask style) */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-[85%] h-[85%] relative">
            {/* Pink Spheres */}
            <div className="absolute top-[20%] left-[10%] w-32 h-32 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 blur-xs shadow-lg opacity-85" />
            <div className="absolute bottom-[20%] right-[12%] w-40 h-40 rounded-full bg-gradient-to-tr from-pink-600 to-pink-400 blur-xs shadow-xl opacity-90" />
            {/* Cyan Cylinders */}
            <div className="absolute top-[15%] right-[18%] w-24 h-48 rounded-full bg-gradient-to-b from-cyan-400 to-teal-500 rotate-12 blur-xs opacity-75 shadow-lg" />
            <div className="absolute bottom-[10%] left-[14%] w-20 h-40 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500 -rotate-12 blur-xs opacity-80 shadow-lg" />
            {/* Orange Arches / Torus */}
            <div className="absolute top-[50%] left-[2%] w-48 h-20 rounded-full border-[18px] border-orange-500 opacity-60 rotate-45 blur-xs" />
            <div className="absolute top-[35%] right-[2%] w-40 h-40 rounded-full bg-gradient-to-r from-orange-400 to-yellow-500 blur-xs opacity-80" />
          </div>
        </div>

        {/* Title Content */}
        <div className="max-w-6xl mx-auto text-center flex flex-col items-center gap-6 relative z-10">
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-[0.82] text-white uppercase drop-shadow-[0_4px_12px_rgba(28,13,63,0.15)] flex flex-col items-center">
            <span>GET MORE</span>
            <span className="h-20 sm:h-28 md:h-36" /> {/* Spacer gap for centered Fox mascot */}
            <span>OUT OF SHOPPING</span>
          </h1>

          <button 
            onClick={() => navigate('/search')}
            className="mt-8 px-8 py-3 rounded-full text-xs font-extrabold bg-black text-white hover:bg-slate-900 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-slate-950/20 uppercase tracking-wider"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* SECTION 2: RISING PHONE MOCKUP */}
      <section className="h-screen w-full flex items-center justify-center relative px-6 z-10 bg-[#FAF5F0]">
        
        <motion.div 
          style={{ translateY: phoneTranslateY, rotateX: phoneRotateX, scale: phoneScale, perspective: 800 }}
          className="w-72 h-[460px]"
        >
          <motion.div
            whileHover={{ scale: 1.06 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-full h-full rounded-[36px] bg-slate-900 border-[6px] border-slate-950 shadow-2xl flex flex-col p-4 relative overflow-hidden text-left cursor-pointer"
          >
            {/* Speaker capsule */}
            <div className="w-20 h-4 bg-slate-950 rounded-full self-center mb-3"></div>

            {/* Wallet Header */}
            <div className="flex justify-between items-center mb-4 text-white text-[10px] font-bold">
              <span className="tracking-wider">NEXACART</span>
              <span className="px-2 py-0.5 rounded bg-orange-500 text-white text-[8px]">PRO MEMBER</span>
            </div>

            {/* Account Subtotal Display */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white flex flex-col gap-1 text-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Total Shopping Balance</span>
              <span className="text-2xl font-black font-mono text-white">$1,250.00</span>
              <span className="text-[9px] text-orange-500 font-bold uppercase mt-1">3 Curated Items Loaded</span>
            </div>

            {/* Shopping items list */}
            <div className="flex-grow overflow-y-auto mt-4 pr-1 flex flex-col gap-2">
              {[
                { desc: 'Heritage Backpack', value: '$180.00', status: 'In Cart', color: 'text-orange-500' },
                { desc: 'Chrono Brass Wristwatch', price: '$320.00', value: '$320.00', status: 'In Cart', color: 'text-orange-500' },
                { desc: 'Minimalist Felt Desk Pad', value: '$35.00', status: 'In Cart', color: 'text-orange-500' }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-white">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-200">{item.desc}</span>
                    <span className="text-[8px] text-slate-400 font-semibold">{item.status}</span>
                  </div>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Checkout Button */}
            <button 
              onClick={() => navigate('/search')}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors cursor-pointer uppercase tracking-wider text-center mt-3"
            >
              Go to Checkout
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 3: INTERLOCKING FEATURES GRID (IMAGE 1 GAP MECHANICS) */}
      <section className="h-screen w-full flex items-center justify-center relative px-6 z-10 bg-[#FAF5F0]">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch min-h-[360px]">
          
          {/* Left Grid Card: Dark Purple Curation Panel */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="md:col-span-5 bg-[#1C0D3F] text-white p-8 rounded-3xl flex flex-col justify-between text-left shadow-lg cursor-pointer"
          >
            <div>
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-400/20">Unified Catalog</span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none mt-4">
                All your networks <br />All your assets <br />All in one place
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Connect and filter styles instantly. View curated feeds customized to your exact retail style.
              </p>
            </div>

            {/* Micro Curation Card Mockup */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 mt-4 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[8px] font-bold">N</div>
                <span className="font-bold text-slate-200">Exclusive Bundle</span>
              </div>
              <span className="font-extrabold text-orange-400 font-mono">$535.00</span>
            </div>
          </motion.div>

          {/* Middle Spacer Column: Sits Fox Mascot in the gap */}
          <div className="hidden md:block md:col-span-2" />

          {/* Right Grid Card: Orange Savings Panel */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="md:col-span-5 bg-[#F97316] text-white p-8 rounded-3xl flex flex-col justify-between text-left shadow-lg cursor-pointer"
          >
            <div>
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-800 bg-white/20 px-2 py-0.5 rounded-full border border-white/10">Member Yields</span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none mt-4">
                Earn discounts <br />on your purchases <br />every single day
              </h3>
              <p className="text-[10px] text-orange-100 mt-2 leading-relaxed">
                Unlock exclusive coupon savings rates by claiming rewards inside your account panel.
              </p>
            </div>

            {/* Savings Graph mockup */}
            <div className="h-16 relative mt-4 bg-black/10 rounded-2xl border border-white/5 overflow-hidden flex items-end">
              <svg viewBox="0 0 100 30" className="w-full h-full text-white fill-none stroke-current" strokeWidth="1.5">
                <path d="M 0,25 Q 25,20 50,15 T 100,5" />
                <circle cx="50" cy="15" r="2.5" fill="#00E5FF" />
                <circle cx="100" cy="5" r="2.5" fill="#00E5FF" />
              </svg>
            </div>
          </motion.div>

        </div>
      </section>

      {/* SECTION 4: 3D PERSPECTIVE TYPOGRAPHY */}
      <section className="h-screen w-full flex items-center justify-center relative px-6 z-10 select-none overflow-hidden bg-[#FAF5F0] border-t border-orange-100/50">
        
        {/* Background product illustration card */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            whileHover={{ scale: 1.05, y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-72 h-[440px] rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-500 to-orange-500 shadow-2xl relative flex items-center justify-center pointer-events-auto cursor-pointer"
          >
            <ShoppingBag className="w-24 h-24 text-white/20 absolute" />
            <span className="text-white/60 font-black text-sm tracking-widest uppercase">NEXASHOP LIFESTYLE</span>
          </motion.div>
        </div>

        {/* 3D Perspective tilting title */}
        <div className="max-w-6xl mx-auto text-center flex flex-col items-center z-10">
          <motion.h2 
            style={{ rotateX: textRotateX, rotateY: textRotateY, scale: textScale, perspective: 800, transformStyle: 'preserve-3d' }}
            className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-[0.82] text-slate-800 uppercase drop-shadow-lg"
          >
            THE <br />EVERYTHING <br />STORE
          </motion.h2>
        </div>
      </section>

      {/* SECTION 5: PRODUCTS CATALOG & GET STARTED BANNER */}
      <section className="min-h-screen w-full bg-white/60 border-t border-orange-100/50 py-24 px-6 relative flex flex-col justify-center items-center gap-12 z-10">
        
        {/* Full-Width Get Started Banner Card */}
        <motion.div 
          onClick={() => navigate('/search')}
          whileHover={{ scale: 1.03, y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="max-w-6xl w-full h-[420px] bg-[#020436] rounded-[36px] shadow-2xl relative overflow-hidden cursor-pointer flex items-center justify-center"
        >
          
          {/* Abstract 3D shape compositions in card background (Matches Screenshot) */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Light Blue Arch on the right */}
            <div className="w-[180px] h-[340px] bg-[#6ED2E0] rounded-full absolute left-[56%] top-[5%] -translate-x-1/2 opacity-95" />
            
            {/* Yellow Bowl/Funnel in the upper center */}
            <div className="w-[300px] h-[150px] bg-[#E1C238] rounded-b-full absolute left-[50%] top-[15%] -translate-x-1/2 opacity-95 border-t-[8px] border-[#020436]/20" />
            
            {/* Pink Sphere at the bottom */}
            <div className="w-[320px] h-[320px] bg-[#EC7CB5] rounded-full absolute left-[48%] top-[50%] -translate-x-1/2 opacity-95" />
          </div>

          {/* Centered mascot in front of abstract shapes */}
          <div className="relative z-10 flex items-center justify-center w-full h-full pb-8 pointer-events-none">
            {/* NexaFox Mascot acting as the colorful centered character */}
            <NexaFox size={290} className="transform translate-y-8" />
          </div>

          {/* Centered Typography Overlay (Matches Screenshot Font and Pill Button) */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center pointer-events-none">
            <h2 
              style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}
              className="text-7xl sm:text-8xl font-black text-white uppercase tracking-tighter leading-[0.80] flex flex-col items-center drop-shadow-[0_4px_16px_rgba(2,4,54,0.4)] select-none"
            >
              <span>GET</span>
              <span>STARTED</span>
            </h2>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/search');
              }}
              className="mt-6 px-7 py-2.5 rounded-full text-[10px] font-black bg-white text-black hover:bg-slate-100 transition-all cursor-pointer shadow-xl uppercase tracking-widest pointer-events-auto border border-black/5"
            >
              Get Started
            </button>
          </div>

        </motion.div>

        {/* Database Products Grid */}
        <div className="text-center flex flex-col items-center gap-2 mt-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-100/60 px-3 py-1 rounded-full">
            <ShoppingBag className="w-3.5 h-3.5" /> Featured Catalog
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1C0D3F] tracking-tight">
            Exclusive Workstations & Gear
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-7xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 rounded-xl bg-orange-100/10 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-7xl">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}

        <button 
          onClick={() => navigate('/search')}
          className="px-6 py-3.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-lg mt-4 uppercase tracking-wider cursor-pointer"
        >
          Explore Full Catalog
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Premium Marquee Banner at bottom */}
        <div className="w-screen bg-slate-900 text-[#FCFAF7] py-3.5 border-y border-orange-500/15 flex whitespace-nowrap text-[10px] font-black tracking-widest uppercase mt-12 relative left-1/2 right-1/2 -translate-x-1/2 z-20">
          <div className="animate-marquee flex gap-12 shrink-0">
            <span>EXCLUSIVE RETAIL GEAR</span> • <span>NEW HARDWARE ARRIVALS</span> • <span>MEMBERS SAVE 15% AUTOMATICALLY</span> • <span>CURATED WORKSTATIONS</span> •
            <span>EXCLUSIVE RETAIL GEAR</span> • <span>NEW HARDWARE ARRIVALS</span> • <span>MEMBERS SAVE 15% AUTOMATICALLY</span> • <span>CURATED WORKSTATIONS</span> •
          </div>
          <div className="animate-marquee flex gap-12 shrink-0" aria-hidden="true">
            <span>EXCLUSIVE RETAIL GEAR</span> • <span>NEW HARDWARE ARRIVALS</span> • <span>MEMBERS SAVE 15% AUTOMATICALLY</span> • <span>CURATED WORKSTATIONS</span> •
            <span>EXCLUSIVE RETAIL GEAR</span> • <span>NEW HARDWARE ARRIVALS</span> • <span>MEMBERS SAVE 15% AUTOMATICALLY</span> • <span>CURATED WORKSTATIONS</span> •
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
