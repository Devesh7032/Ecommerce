const { Client } = require('pg');

const connectionString = "postgresql://postgres.okwmhbjqhjqslyqktbll:Deveshv%401234@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

// Parse CLI arguments
const args = process.argv.slice(2);
let count = 10500; // Default count > 10,000
for (const arg of args) {
  if (arg.startsWith('--count=')) {
    count = parseInt(arg.split('=')[1], 10);
  }
}

if (isNaN(count) || count < 1) {
  count = 10500;
}

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', description: 'Cutting-edge gadgets, audio systems, and advanced hardware.', image_id: 'photo-1498049794561-7780e7231661' },
  { name: 'Mobiles', slug: 'mobiles', description: 'Next-generation smartphones, folding devices, and accessories.', image_id: 'photo-1511707171634-5f897ff02aa9' },
  { name: 'Laptops', slug: 'laptops', description: 'High-performance computing, ultrabooks, and professional workstations.', image_id: 'photo-1496181130204-755241524eab' },
  { name: 'Televisions', slug: 'televisions', description: 'Next-generation smart TVs, OLED screens, and home theater displays.', image_id: 'photo-1593305841991-05c297ba4575' },
  { name: 'Fashion', slug: 'fashion', description: 'Premium designer apparel, street wear, and tailored garments.', image_id: 'photo-1483985988355-763728e1935b' },
  { name: 'Shoes', slug: 'shoes', description: 'Athletic footwear, designer sneakers, and classic leather boots.', image_id: 'photo-1542291026-7eec264c27ff' },
  { name: 'Watches', slug: 'watches', description: 'Luxury chronographs, smartwatches, and minimalist timepieces.', image_id: 'photo-1523275335684-37898b6baf30' },
  { name: 'Beauty', slug: 'beauty', description: 'Organic skincare, premium cosmetics, and personal grooming.', image_id: 'photo-1522335789203-aabd1fc54bc9' },
  { name: 'Gaming', slug: 'gaming', description: 'Next-gen consoles, mechanical keyboards, and gaming gear.', image_id: 'photo-1607604276583-eef5d076aa5f' },
  { name: 'Books', slug: 'books', description: 'Bestselling fiction, technology guides, and inspiring memoirs.', image_id: 'photo-1497633762265-9d179a990aa6' },
  { name: 'Sports', slug: 'sports', description: 'Fitness equipment, outdoor gear, and professional sports goods.', image_id: 'photo-1461896836934-ffe607ba8211' },
  { name: 'Furniture', slug: 'furniture', description: 'Minimalist designer furniture, ergonomic chairs, and modern decor.', image_id: 'photo-1524758631624-e2822e304c36' },
  { name: 'Kitchen', slug: 'kitchen', description: 'Premium cookware, chef knives, and smart culinary accessories.', image_id: 'photo-1556910103-1c02745aae4d' },
  { name: 'Home Appliances', slug: 'home-appliances', description: 'Smart robot vacuums, air purifiers, and core home machinery.', image_id: 'photo-1584622650111-993a426fbf0a' },
  { name: 'Grocery', slug: 'grocery', description: 'Artisanal organic foods, cold pressed oils, and pantry reserves.', image_id: 'photo-1542838132-92c53300491e' }
];

const BRANDS = {
  Electronics: ['Sony', 'Bose', 'Sennheiser', 'JBL', 'Sonos', 'Anker'],
  Mobiles: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Nothing'],
  Laptops: ['Apple', 'Dell', 'Lenovo', 'HP', 'ASUS', 'Razer'],
  Televisions: ['Samsung', 'Sony', 'LG', 'TCL', 'Hisense'],
  Fashion: ['Nike', 'Adidas', 'Uniqlo', 'Zara', 'Ralph Lauren', 'Patagonia'],
  Shoes: ['Nike', 'Adidas', 'Puma', 'New Balance', 'Timberland', 'Dr. Martens'],
  Watches: ['Rolex', 'Seiko', 'Omega', 'Casio', 'Apple', 'Garmin'],
  Beauty: ['L\'Oreal', 'Estée Lauder', 'Ordinary', 'CeraVe', 'Dyson', 'Chanel'],
  Gaming: ['Razer', 'Logitech', 'Corsair', 'Sony', 'Microsoft', 'Nintendo'],
  Books: ['O\'Reilly', 'Penguin', 'HarperCollins', 'Macmillan', 'Pearson'],
  Sports: ['Under Armour', 'Wilson', 'Decathlon', 'Spalding', 'Yeti', 'Bowflex'],
  Furniture: ['IKEA', 'Herman Miller', 'Ashley', 'West Elm', 'Steelcase'],
  Kitchen: ['Wüsthof', 'Le Creuset', 'KitchenAid', 'Instant Pot', 'Breville'],
  'Home Appliances': ['Dyson', 'iRobot', 'Philips', 'LG', 'Samsung', 'Xiaomi'],
  Grocery: ['Whole Foods', 'Kirkland', 'Trader Joe\'s', 'Heinz', 'Nestle']
};

const PRODUCT_TEMPLATES = {
  Electronics: [
    { name: 'Noise-Cancelling Wireless Headphones', desc: 'Experience studio-quality audio with advanced active noise cancellation and 40-hour battery life.' },
    { name: 'Portable Bluetooth Speaker v5.2', desc: 'Waterproof outdoor speaker with rich bass, 360-degree sound projection, and LED beat-sync lights.' },
    { name: 'Smart Soundbar with Dolby Atmos', desc: 'Immersive home theater soundbar featuring 5.1 channel surround sound and built-in voice assistants.' },
    { name: 'Professional Condenser Microphone', desc: 'Studio microphone with cardioid pickup pattern, perfect for podcasting, streaming, and vocal recording.' },
    { name: 'Wireless Charging Dock 3-in-1', desc: 'Sleek multi-device charging stand for your smartphone, smartwatch, and wireless earbuds.' }
  ],
  Mobiles: [
    { name: 'Flagship Smartphone 5G', desc: 'Stunning high-resolution display, advanced multi-camera array, and industry-leading processing power.' },
    { name: 'Minimalist Smartphone (Special Edition)', desc: 'Clean operating system, customizable glyph interface, and eco-friendly recycled build.' },
    { name: 'Compact Foldable Phone', desc: 'Revolutionary folding screen design that fits in any pocket, with a robust external status screen.' },
    { name: 'Ultra Battery Smartphone', desc: 'Heavy-duty design with massive battery capacity, IP68 waterproofing, and drop protection.' },
    { name: 'Budget-Friendly 5G Device', desc: 'Smooth performance, multi-day battery, and sleek modern design at an accessible price point.' }
  ],
  Laptops: [
    { name: 'Pro Workstation Laptop', desc: 'Ultra-fast processor, massive unified memory, and a breathtaking color-accurate display for creators.' },
    { name: 'Carbon Fiber Ultrabook', desc: 'Feather-light professional business notebook featuring 20+ hours of battery life and enterprise security.' },
    { name: 'Ultimate Gaming Laptop', desc: 'Next-generation dedicated graphics card, high refresh-rate screen, and advanced liquid cooling.' },
    { name: 'Convertible 2-in-1 Laptop', desc: 'Versatile touch-screen design with responsive stylus support, perfect for design and note-taking.' },
    { name: 'Developer Edition Notebook', desc: 'Pre-installed developer utilities, optimized Linux compatibility, and modular repairable parts.' }
  ],
  Televisions: [
    { name: '4K Ultra HD Smart TV', desc: 'Stunning 4K resolution, HDR support, built-in streaming apps, and voice control compatibility.' },
    { name: 'OLED Smart Television', desc: 'Perfect blacks, infinite contrast, and cinematic audio powered by Dolby Vision.' },
    { name: 'QLED 8K Smart TV', desc: 'Next-generation 8K resolution, AI-powered upscaling, and an ultra-thin bezel design.' },
    { name: 'Mini-LED Gaming TV', desc: '144Hz refresh rate, low input lag, VRR support, and immersive gaming audio features.' },
    { name: 'Smart LED TV', desc: 'Vibrant colors, full HD resolution, smart connectivity, and clean cable management.' }
  ],
  Fashion: [
    { name: 'Slim-Fit Cotton Oxford Shirt', desc: 'Premium long-staple cotton shirt, tailored fit, and breathable weave for formal or casual wear.' },
    { name: 'Unisex Classic Denim Jacket', desc: 'Heavyweight organic denim, reinforced metal buttons, and a timeless vintage-wash finish.' },
    { name: 'Merino Wool Crewneck Sweater', desc: 'Ultra-soft ethically sourced Merino wool sweater providing exceptional warmth and moisture wicking.' },
    { name: 'Relaxed Fit Chino Pants', desc: 'Durable stretch cotton chinos with a modern tapered cut, ideal for day-to-night versatility.' },
    { name: 'Water-Resistant Windbreaker', desc: 'Lightweight packable shell with hood, drawstring adjustments, and zipped security pockets.' }
  ],
  Shoes: [
    { name: 'Carbon-Plate Running Sneakers', desc: 'Superlight marathon running shoes with energy-returning foam midsole and breathable mesh upper.' },
    { name: 'Classic Leather Chelsea Boots', desc: 'Premium hand-finished full grain leather boots with elastic side panels and durable rubber sole.' },
    { name: 'Retro Court Skate Shoes', desc: 'Vintage-inspired low top sneakers featuring reinforced canvas details and vulcanized rubber grip.' },
    { name: 'Waterproof Trail Hiking Boots', desc: 'Rugged outdoor boots with Gore-Tex lining, steel shank support, and deep-lug Vibram outsole.' },
    { name: 'Ergonomic Daily Walking Shoes', desc: 'Orthotic arch support, cushioned shock absorption, and slip-on mesh upper for all-day comfort.' }
  ],
  Watches: [
    { name: 'Automatic Diver Chronograph', desc: 'Mechanical self-winding watch, 200m water resistance, rotating ceramic bezel, and luminous hands.' },
    { name: 'Advanced Smart Sports Watch', desc: 'GPS tracking, heart rate monitor, blood oxygen tracker, and multi-sport performance analytics.' },
    { name: 'Minimalist Dress Watch', desc: 'Ultra-thin steel case, clean sub-dial layout, and a genuine Italian leather strap.' },
    { name: 'Hybrid Smart Titanium Watch', desc: 'Traditional analog watch face with a hidden OLED smart notification screen and 14-day battery.' },
    { name: 'Time-tested Quartz Leather Watch', desc: 'Classic rectangular gold-tone case, heritage dial engraving, and textured brown leather band.' }
  ],
  Beauty: [
    { name: 'Organic Hyaluronic Acid Serum', desc: 'Deeply hydrating facial serum enriched with vitamin B5 and botanical extracts for a youthful glow.' },
    { name: 'Restorative Night Cream', desc: 'Rich overnight moisturizer with ceramides and peptides to support the skin\'s natural recovery barrier.' },
    { name: 'Sulfate-Free Clarifying Shampoo', desc: 'Gentle exfoliating scalp treatment containing tea tree oil and rosemary to remove product buildup.' },
    { name: 'Premium Hair Dryer and Styler', desc: 'High-speed digital motor with intelligent heat control to prevent damage and maximize shine.' },
    { name: 'Mineral Sunscreen SPF 50+', desc: 'Non-greasy, broad-spectrum physical sunscreen containing zinc oxide and calming chamomile extract.' }
  ],
  Gaming: [
    { name: 'RGB Hot-Swappable Mechanical Keyboard', desc: 'Tenkeyless layout, double-shot PBT keycaps, custom linear switches, and sound-dampening foam.' },
    { name: 'Ultra-Lightweight Wireless Gaming Mouse', desc: 'Ergonomic 58g design, sub-millisecond wireless latency, and a state-of-the-art 26K DPI optical sensor.' },
    { name: 'Pro Wireless Gaming Headset', desc: 'Lossless audio connection, spatial audio mapping, and a broadcast-grade retractable microphone.' },
    { name: 'Customizable Ergonomic Controller', desc: 'Hall-effect analog sticks, remappable back paddles, and adjustable trigger stops for competitive play.' },
    { name: 'Premium XL Desk Mat', desc: 'Low-friction micro-woven cloth surface, stitched anti-fray borders, and non-slip rubber base.' }
  ],
  Books: [
    { name: 'Architectures of Tomorrow: A Guide to Distributed Systems', desc: 'Master scalability, message queues, and high-availability database design pattern blueprints.' },
    { name: 'Designing with Tailwind and Modern CSS Frameworks', desc: 'Learn core visual design systems, layout constraints, and responsive typography guidelines.' },
    { name: 'Shadows of the Code: A Cyberpunk Thriller', desc: 'A gripping sci-fi novel exploring rogue AI agents, digital espionage, and underground hacking networks.' },
    { name: 'The Art of Clean Architecture', desc: 'A developer\'s bible on software patterns, interface design, decoupling layers, and testability.' },
    { name: 'Deep Work: Success in a Distracted World', desc: 'Strategies for focusing on demanding cognitive tasks and training your attention span.' }
  ],
  Sports: [
    { name: 'Premium Eco-Friendly Yoga Mat', desc: 'Non-slip natural tree rubber mat with alignment markings and extra joint cushioning.' },
    { name: 'Carbon Fiber Tennis Racket', desc: 'Professional pre-strung racket offering superior control, vibration dampening, and lightweight swing.' },
    { name: 'Adjustable Dumbbells Set (50 lbs)', desc: 'Space-saving selectorized weights that adjust in 5-pound increments with a simple twist.' },
    { name: 'High-Performance Insulated Water Bottle', desc: 'Double-wall vacuum insulated stainless steel flask, keeping drinks ice-cold for up to 36 hours.' },
    { name: 'Anti-Burst Gym Stability Ball', desc: 'Professional grade exercise ball for core training, balance workouts, and ergonomic desk seating.' }
  ],
  Furniture: [
    { name: 'Ergonomic Task Office Chair', desc: 'Fully adjustable lumbar support, 3D armrests, breathable mesh back, and synchro-tilt mechanism.' },
    { name: 'Minimalist Solid Oak Coffee Table', desc: 'Scandi-inspired solid oak table with clean lines, tapered legs, and a spacious lower storage shelf.' },
    { name: 'Modern Mid-Century Walnut Desk', desc: 'Crafted walnut wood desk with integrated cable routing channels and soft-close storage drawers.' },
    { name: 'Upholstered Velvet Accent Chair', desc: 'Premium velvet fabric, tufted backing, and gold-finished metal legs for a touch of luxury.' },
    { name: 'Modular Floating Wall Shelves', desc: 'Set of 3 heavy-duty solid pine floating shelves with invisible metal mounting hardware.' }
  ],
  Kitchen: [
    { name: '8-inch Damascus Steel Chef Knife', desc: 'Hand-forged 67-layer Damascus steel blade with a moisture-resistant G10 composite handle.' },
    { name: 'Enamelled Cast Iron Dutch Oven', desc: 'Heavy-duty 5.5-quart casserole pot offering superior heat retention and self-basting lid ridges.' },
    { name: 'Non-Stick Ceramic Skillet Set', desc: 'Eco-friendly ceramic coating, free of PFAS/PFOA, with comfortable stainless steel handles.' },
    { name: 'Precision Electric Gooseneck Kettle', desc: 'Variable temperature control, LCD display, 1200W rapid boil, and a precise pour spout.' },
    { name: 'Double-Walled Glass French Press', desc: 'Borosilicate glass server with double wall insulation and a triple-layer steel filter press.' }
  ],
  'Home Appliances': [
    { name: 'Lidar Robotic Vacuum Cleaner', desc: 'Intelligent laser mapping navigation, powerful 4000Pa suction, and auto-empty charging dock.' },
    { name: 'HEPA Smart Air Purifier v2', desc: '3-stage air filtration system capturing 99.97% of particles, with real-time air quality metrics.' },
    { name: 'Compact Countertop Air Fryer', desc: 'Rapid 360 air circulation technology, digital touchscreen, and non-stick dishwasher-safe basket.' },
    { name: 'Smart Cool Mist Humidifier', desc: 'Large 4L tank, top-fill design, automatic humidity sensors, and quiet whisper-level operation.' },
    { name: 'Professional Garment Steamer', desc: 'Powerful continuous steam, 1.5L water tank, rapid 45-second heat-up, and fabric brush tool.' }
  ],
  Grocery: [
    { name: 'Grade-A Organic Maple Syrup', desc: '100% pure organic dark maple syrup, sustainably tapped and packaged in glass bottles.' },
    { name: 'Gourmet Roasted Salted Almonds', desc: 'Dry-roasted California almonds lightly dusted with sea salt, packed in resealable stay-fresh pouches.' },
    { name: 'Cold-Pressed Extra Virgin Olive Oil', desc: 'Single-origin estate olive oil, cold-pressed within hours of harvest for exceptional peppery flavor.' },
    { name: 'Organic Matcha Green Tea Powder', desc: 'Ceremonial grade stone-ground Japanese matcha, rich in antioxidants and vibrant emerald color.' },
    { name: 'Artisanal Dark Chocolate Bar (85%)', desc: 'Single-origin fair trade cocoa beans, stone-ground with hints of sea salt and organic vanilla.' }
  ]
};

const UNSPLASH_IDS = {
  Electronics: ['photo-1505740420928-5e560c06d30e', 'photo-1546435770-a3e426bf472b', 'photo-1583394838336-acd977736f90', 'photo-1590658268037-6bf12165a8df'],
  Mobiles: ['photo-1598327105666-5b89351aff97', 'photo-1565849906661-09a665e40b48', 'photo-1511707171634-5f897ff02aa9', 'photo-1580910051074-3eb694886505'],
  Laptops: ['photo-1588872657578-7efd1f1555ed', 'photo-1484788984921-03950022c9ef', 'photo-1603302576837-37561b2e2302', 'photo-1531297484001-80022131f5a1'],
  Televisions: ['photo-1593305841991-05c297ba4575', 'photo-1593784991095-a205069470b6', 'photo-1552533048-c9c262507bf8', 'photo-1601944179066-29786cb9d32a'],
  Fashion: ['photo-1515886657613-9f3515b0c78f', 'photo-1554412933-514a83d2f3c8', 'photo-1490481651871-ab68de25d43d', 'photo-1434389677669-e08b4cac3105'],
  Shoes: ['photo-1595950653106-6c9ebd614d3a', 'photo-1608231387042-66d1773070a5', 'photo-1606107557195-0e29a4b5b4aa', 'photo-1549298916-b41d501d3772'],
  Watches: ['photo-1508685096489-7aacd43bd3b1', 'photo-1524805444758-089113d48a6d', 'photo-1542496658-e33a6d0d50f6', 'photo-1539874754764-5a96559165b0'],
  Beauty: ['photo-1601049541289-9b1b7bbbfe19', 'photo-1596462502278-27bfdc403348', 'photo-1556228720-195a672e8a03', 'photo-1571781926291-c477ebfd024b'],
  Gaming: ['photo-1538481199705-c710c4e965fc', 'photo-1542751371-adc38448a05e', 'photo-1612287230202-1bf1d85d1bdf', 'photo-1580234810907-b40315b76418'],
  Books: ['photo-1544947950-fa07a98d237f', 'photo-1512820790803-83ca734da794', 'photo-1532012197267-da84d127e765', 'photo-1516979187457-637abb4f9353'],
  Sports: ['photo-1517838277536-f5f99be501cd', 'photo-1530541930197-ff16ac917b0e', 'photo-1584735935682-2f2b69dff9d2', 'photo-1574629810360-7efbbe195018'],
  Furniture: ['photo-1586023492125-27b2c045efd7', 'photo-1555041469-a586c61ea9bc', 'photo-1567538096630-e0c55bd6374c', 'photo-1505691938895-1758d7feb511'],
  Kitchen: ['photo-1556911220-e15b29be8c8f', 'photo-1590794056226-79ef3a8147e1', 'photo-1556909114-f6e7f77ee310', 'photo-1600585154526-990dced4db0d'],
  'Home Appliances': ['photo-1584622650111-993a426fbf0a', 'photo-1527018601619-a508a2be00cd', 'photo-1626336990559-9922261f28df', 'photo-1581578731548-c64695cc6952'],
  Grocery: ['photo-1578916171728-46686eac8d58', 'photo-1588964895597-cfccd6e2dbf9', 'photo-1543083477-4f7f010a667f', 'photo-1471193945509-9ad0617afabf']
};

async function seed() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL database for seeding...");

    // 1. Clean existing data
    console.log("Cleaning database tables...");
    await client.query("TRUNCATE TABLE public.categories, public.products CASCADE");

    // 2. Insert Categories
    console.log(`Inserting ${CATEGORIES.length} categories...`);
    const categoryMap = new Map();
    
    for (const cat of CATEGORIES) {
      const imgUrl = `https://images.unsplash.com/${cat.image_id}?w=800&auto=format&fit=crop&q=80`;
      const res = await client.query(
        "INSERT INTO public.categories (name, slug, image_url, description) VALUES ($1, $2, $3, $4) RETURNING id",
        [cat.name, cat.slug, imgUrl, cat.description]
      );
      categoryMap.set(cat.name, res.rows[0].id);
    }
    console.log("Categories inserted successfully!");

    // 3. Generate and Bulk Insert Products
    console.log(`Generating ${count} products...`);
    const products = [];
    
    for (let i = 0; i < count; i++) {
      // Pick a random category
      const catKey = CATEGORIES[i % CATEGORIES.length].name;
      const catId = categoryMap.get(catKey);
      
      // Get templates and brands
      const templates = PRODUCT_TEMPLATES[catKey];
      const brands = BRANDS[catKey];
      const template = templates[i % templates.length];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      
      // Generate highly realistic model names based on brand and category
      let modelName = template.name;
      if (catKey === 'Mobiles') {
        if (brand === 'Apple') {
          const models = ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 13 Mini', 'iPhone SE (3rd Gen)'];
          modelName = models[i % models.length];
        } else if (brand === 'Samsung') {
          const models = ['Galaxy S24 Ultra', 'Galaxy Z Fold 5', 'Galaxy S23 FE', 'Galaxy A54 5G', 'Galaxy Z Flip 5', 'Galaxy S24+'];
          modelName = models[i % models.length];
        } else if (brand === 'Google') {
          const models = ['Pixel 8 Pro', 'Pixel 7a', 'Pixel Fold', 'Pixel 8', 'Pixel 7 Pro'];
          modelName = models[i % models.length];
        }
      } else if (catKey === 'Laptops') {
        if (brand === 'Apple') {
          const models = ['MacBook Pro 16" (M3 Max)', 'MacBook Air 15" (M3)', 'MacBook Pro 14" (M3 Pro)', 'MacBook Air 13" (M2)'];
          modelName = models[i % models.length];
        } else if (brand === 'Dell') {
          const models = ['XPS 15 Premium', 'Inspiron 16 2-in-1', 'Latitude 7440 Workstation', 'Alienware m18 Gaming Laptop'];
          modelName = models[i % models.length];
        }
      } else if (catKey === 'Televisions') {
        if (brand === 'Samsung') {
          const models = ['Neo QLED 8K Smart TV', 'The Frame QLED TV', 'Crystal 4K UHD Smart TV', 'OLED S90C Series TV'];
          modelName = models[i % models.length];
        } else if (brand === 'Sony') {
          const models = ['Bravia XR OLED TV', 'Bravia 4K HDR TV', 'Bravia XR Mini-LED TV'];
          modelName = models[i % models.length];
        } else if (brand === 'LG') {
          const models = ['OLED evo C3 Series TV', 'QNED Mini-LED 4K TV', 'UR9000 Series UHD TV'];
          modelName = models[i % models.length];
        }
      }

      // Generate product name & description variations
      const indexNum = Math.floor(i / (CATEGORIES.length * templates.length)) + 1;
      const name = `${brand} ${modelName} ${indexNum > 1 ? '#' + indexNum : ''}`.trim();
      const description = `${template.desc} Perfect for daily use and designed with premium materials. Brand: ${brand}. Generation series: ${indexNum}.`;
      
      // Prices (Premium pricing feel)
      const basePrice = Math.floor(Math.random() * 950) + 49; // 49 to 999
      const price = basePrice + 0.99;
      // 30% chance of sale price
      const hasSale = Math.random() < 0.3;
      const sale_price = hasSale ? Math.floor(price * 0.85) + 0.99 : null;
      
      const sku = `NX-${catKey.substring(0, 3).toUpperCase()}-${100000 + i}`;
      const stock_quantity = Math.random() < 0.05 ? 0 : Math.floor(Math.random() * 200) + 5; // 5% out of stock
      
      // Rating & reviews
      const rating = Math.random() < 0.1 ? 0 : (Math.random() * 2 + 3).toFixed(1); // ratings between 3.0 and 5.0, or 0
      const reviews_count = rating === 0 ? 0 : Math.floor(Math.random() * 120) + 1;

      // Select 3 random image URLs for gallery
      const catUnsplashIds = UNSPLASH_IDS[catKey];
      const images = [];
      for (let j = 0; j < 3; j++) {
        const photoId = catUnsplashIds[(i + j) % catUnsplashIds.length];
        images.push(`https://images.unsplash.com/${photoId}?w=800&auto=format&fit=crop&q=80`);
      }

      // JSON Specifications (Attributes)
      const colors = ['Midnight Black', 'Space Gray', 'Alabaster White', 'Navy Blue', 'Forest Green'];
      const attributes = {
        brand: brand,
        color: colors[i % colors.length],
        warranty: '1 Year Limited',
        weight: `${(Math.random() * 2 + 0.1).toFixed(2)} kg`,
        model_year: 2026 - (i % 2)
      };

      // Add category-specific variants
      if (catKey === 'Fashion') {
        attributes.sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        attributes.fabric = '100% Organic Cotton';
        attributes.available_colors = ['Charcoal Black', 'Navy Blue', 'Olive Green', 'Crimson Red'];
      } else if (catKey === 'Shoes') {
        attributes.sizes = ['7', '8', '9', '10', '11', '12'];
        attributes.material = 'Full Grain Leather / Mesh';
        attributes.available_colors = ['Sport White', 'Carbon Black', 'Retro Red'];
      } else if (catKey === 'Mobiles') {
        attributes.storage_variants = ['128GB', '256GB', '512GB', '1TB'];
        attributes.ram = '8GB / 12GB / 16GB';
        attributes.network = '5G Enabled';
      } else if (catKey === 'Laptops') {
        attributes.storage_variants = ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'];
        attributes.ram_variants = ['8GB RAM', '16GB RAM', '32GB RAM', '64GB RAM'];
        attributes.processor = brand === 'Apple' ? 'Apple M3 chip' : 'Intel Core i7 / Ryzen 7';
      } else if (catKey === 'Televisions') {
        attributes.screen_size_variants = ['43 inches', '55 inches', '65 inches', '75 inches', '85 inches'];
        attributes.display_type = 'OLED / QLED / LED';
        attributes.refresh_rates = ['60Hz', '120Hz', '144Hz'];
      } else if (catKey === 'Gaming') {
        attributes.platform_compatibility = ['PC', 'PlayStation 5', 'Xbox Series X', 'Nintendo Switch'];
        attributes.connection_type = 'Wired / Wireless 2.4GHz';
      } else if (catKey === 'Grocery') {
        attributes.pack_sizes = ['Single Pack (250g)', 'Value Pack (500g)', 'Family Pack (1kg)'];
        attributes.organic = true;
        attributes.dietary = 'Gluten-Free / Vegan';
      }

      products.push({
        name,
        description,
        price,
        sale_price,
        sku,
        stock_quantity,
        category_id: catId,
        images,
        rating,
        reviews_count,
        brand,
        attributes
      });
    }

    console.log("Generating queries and bulk inserting products...");
    
    // Split products into batches of 500 to prevent query size limits
    const BATCH_SIZE = 500;
    for (let b = 0; b < products.length; b += BATCH_SIZE) {
      const batch = products.slice(b, b + BATCH_SIZE);
      
      // We will build a parameterized bulk insert query
      let queryText = "INSERT INTO public.products (name, description, price, sale_price, sku, stock_quantity, category_id, images, rating, reviews_count, brand, attributes) VALUES ";
      const values = [];
      
      const numCols = 12;
      const valueLines = [];
      
      for (let r = 0; r < batch.length; r++) {
        const p = batch[r];
        const offset = r * numCols;
        const placeHolders = Array.from({ length: numCols }, (_, colIndex) => `$${offset + colIndex + 1}`).join(', ');
        valueLines.push(`(${placeHolders})`);
        
        values.push(
          p.name,
          p.description,
          p.price,
          p.sale_price,
          p.sku,
          p.stock_quantity,
          p.category_id,
          p.images,
          p.rating,
          p.reviews_count,
          p.brand,
          JSON.stringify(p.attributes)
        );
      }
      
      queryText += valueLines.join(', ');
      
      console.log(`Inserting batch ${Math.floor(b / BATCH_SIZE) + 1} / ${Math.ceil(products.length / BATCH_SIZE)} (${batch.length} products)...`);
      await client.query(queryText, values);
    }
    
    console.log("Database seeded successfully with all categories and products!");

  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
