import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

// Pages
import { Home } from './pages/Home/Home';
import { Auth } from './pages/Auth/Auth';
import { ProductDetail } from './pages/ProductDetail/ProductDetail';
import { Search } from './pages/Search/Search';
import { Cart } from './pages/Cart/Cart';
import { Wishlist } from './pages/Wishlist/Wishlist';
import { Checkout } from './pages/Checkout/Checkout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Admin } from './pages/Admin/Admin';

export const App: React.FC = () => {
  const initializeAuth = useAuthStore(state => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen relative selection:bg-accent-purple/30 selection:text-white">
        
        {/* Floating Header */}
        <Navbar />

        {/* Dynamic Route Screen Contents */}
        <main className="flex-grow pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/search" element={<Search />} />
            
            {/* Protected Client Pages */}
            <Route 
              path="/cart" 
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/wishlist" 
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected Admin Console Page */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              } 
            />

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Platform Footer */}
        <Footer />

      </div>
    </BrowserRouter>
  );
};

export default App;
