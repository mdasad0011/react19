import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/Auth/hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import { Button } from './ui';
import { Shield, Home, User, LogOut, LogIn, UserPlus } from 'lucide-react';

export const AuthHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Simple avatar letters
  const avatarLetter = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border-primary bg-background-primary/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Brand/Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2 text-text-primary hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary text-text-inverse">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-lg">
            Antigravity Auth
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link to="/">
            <Button
              variant={isActive('/') ? 'secondary' : 'ghost'}
              size="sm"
              className="flex items-center space-x-1.5"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
          {isAuthenticated && (
            <Link to="/profile">
              <Button
                variant={isActive('/profile') ? 'secondary' : 'ghost'}
                size="sm"
                className="flex items-center space-x-1.5"
              >
                <User className="h-4 w-4" />
                <span>Profile Dashboard</span>
              </Button>
            </Link>
          )}
        </nav>

        {/* Right side options */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <Link to="/profile" className="flex items-center space-x-2 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold border border-accent-primary/20 group-hover:bg-accent-primary group-hover:text-text-inverse transition-colors">
                  {avatarLetter}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                  {user?.name}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="hidden sm:flex items-center text-text-secondary hover:text-accent-error"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="flex items-center">
                  <LogIn className="h-4 w-4 mr-1.5" />
                  <span>Login</span>
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  <span>Register</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
