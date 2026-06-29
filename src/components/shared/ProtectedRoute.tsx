import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, profile, loading, initialized } = useAuthStore();
  const location = useLocation();

  // If loading or not initialized yet, show premium loading spinner
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090D] text-white">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-accent-purple animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
