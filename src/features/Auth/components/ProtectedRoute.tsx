import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background-primary text-text-primary">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-4 text-center"
        >
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring */}
            <motion.div
              className="absolute h-16 w-16 rounded-full border-4 border-accent-primary opacity-25"
              animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
            {/* Spinning ring */}
            <motion.div
              className="h-12 w-12 rounded-full border-4 border-accent-secondary border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
            <Shield className="absolute h-5 w-5 text-accent-primary animate-pulse" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-wide">
              Securing Session...
            </h3>
            <p className="text-sm text-text-secondary">
              Verifying JWT Credentials
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, saving the location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
