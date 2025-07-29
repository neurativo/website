import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, BookOpen, Plus, User, BarChart3, Brain, LogOut, Settings, Crown, DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import AuthModal from './AuthModal';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/library', icon: BookOpen, label: 'Library' },
  { path: '/create', icon: Plus, label: 'Create' },
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
];

const Navigation = () => {
  const { user, logout } = useAuth();
  const { currentPlan } = useSubscription();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);



  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderLink = (
    path: string,
    Icon: React.ElementType,
    label: string,
    isActive: boolean,
    isMobile: boolean
  ) => {
    const commonClasses = 'transition-all duration-200 rounded-xl';
    const activeStyles = isMobile
      ? 'text-blue-400 bg-blue-400/10 scale-105'
      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    const defaultStyles = isMobile
      ? 'text-white/70 hover:text-white hover:bg-white/5'
      : 'text-white/80 hover:text-white hover:bg-white/10';

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`${commonClasses} ${isActive ? activeStyles : defaultStyles}`}
      >
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center px-4 py-2`}>
          <Icon className={`${isMobile ? 'w-6 h-6 mb-1' : 'w-5 h-5 mr-2'}`} />
          <span className={`font-semibold ${isMobile ? 'text-xs truncate' : 'text-base'}`}>{label}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-black/20 backdrop-blur-md border-b border-white/10 shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 hover:scale-105 transition-transform">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Neurativo</h1>
            </Link>

            {/* Links */}
            <div className="flex items-center space-x-4">
              {navItems.map(({ path, icon: Icon, label }) => (
                <NavLink key={path} to={path} aria-label={label}>
                  {({ isActive }) => renderLink(path, Icon, label, isActive, false)}
                </NavLink>
              ))}
              
              {/* Pricing Link */}
              <Link to="/pricing">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Pricing</span>
                </motion.div>
              </Link>
            </div>

            {/* User Profile / Auth */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-sm">{user.username || 'User'}</p>
                      <div className="flex items-center space-x-1">
                        {currentPlan?.id !== 'free' && (
                          <Crown className="w-3 h-3 text-yellow-400" />
                        )}
                        <span className="text-white/60 text-xs">{currentPlan?.name || 'Free'}</span>
                      </div>
                    </div>
                  </button>

                  {/* User Menu Dropdown */}
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg"
                    >
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Link
                          to="/pricing"
                          className="flex items-center px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Crown className="w-4 h-4 mr-3" />
                          Upgrade Plan
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-md border-t border-white/10 shadow-inner md:hidden z-50 safe-area-pb">
        <div className="flex items-center justify-around py-3 px-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink key={path} to={path} aria-label={label}>
              {({ isActive }) => renderLink(path, Icon, label, isActive, true)}
            </NavLink>
          ))}
          
          {/* Mobile Auth/Profile */}
          {user ? (
            <Link to="/profile">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
              >
                <User className="w-6 h-6 mb-1" />
                <span className="text-xs truncate">Profile</span>
              </motion.div>
            </Link>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex flex-col items-center px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
            >
              <User className="w-6 h-6 mb-1" />
              <span className="text-xs truncate">Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default Navigation;
