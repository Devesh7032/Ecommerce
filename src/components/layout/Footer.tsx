import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#07070A] border-t border-white/5 mt-20 px-6 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Information */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-accent-indigo via-accent-purple to-accent-blue flex items-center justify-center font-bold text-white text-sm">
              N
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              NexaShop
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            The next-generation marketplace. Experiencing premium futuristic ecommerce shopping backed by cryptographic security, ultra-fast performance, and real-time syncing.
          </p>
          <div className="flex items-center gap-3 mt-2 text-gray-400">
            <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="GitHub">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
          </div>
        </div>

        {/* Categories Links */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Marketplace</h4>
          <ul className="flex flex-col gap-2.5 text-xs text-gray-500">
            <li><Link to="/search?category=electronics" className="hover:text-white transition-colors">Electronics & Hardware</Link></li>
            <li><Link to="/search?category=mobiles" className="hover:text-white transition-colors">Smartphones</Link></li>
            <li><Link to="/search?category=laptops" className="hover:text-white transition-colors">Workstations & Laptops</Link></li>
            <li><Link to="/search?category=fashion" className="hover:text-white transition-colors">Premium Apparel</Link></li>
            <li><Link to="/search?category=watches" className="hover:text-white transition-colors">Luxury Watches</Link></li>
          </ul>
        </div>

        {/* Developer & Platform Info */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Platform</h4>
          <ul className="flex flex-col gap-2.5 text-xs text-gray-500">
            <li><a href="#" className="hover:text-white transition-colors">Security Audit</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Developer APIs</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Merchant Portal</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Newsletter Subscription */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Join NexaClub</h4>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Subscribe to get early access to exclusive product drops, tech deals, and community rewards.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input 
              type="email" 
              placeholder="name@domain.com"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-accent-purple/50 w-full"
            />
            <button 
              type="submit" 
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-200 transition-all cursor-pointer"
            >
              Join
            </button>
          </form>
        </div>

      </div>

      {/* Underbar */}
      <div className="max-w-7xl mx-auto border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-gray-600">
          &copy; {new Date().getFullYear()} NexaShop Inc. All rights reserved.
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
          <Shield className="w-3.5 h-3.5 text-accent-emerald" />
          Secure payment gateways backed by Stripe & PayPal.
        </div>
      </div>
    </footer>
  );
};
