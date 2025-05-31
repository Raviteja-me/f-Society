import React, { useState } from 'react';
import { Home, BookOpen, User, LogOut, Menu, X, LayoutDashboard, Grid } from 'lucide-react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Link } from './Link';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { AuthModal } from './Auth';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { theme } = useTheme();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: Home, text: 'Home', path: '/' },
    { icon: BookOpen, text: 'Courses', path: '/courses' },
    { icon: Grid, text: 'Apps', path: '/apps' },
    { icon: User, text: 'Profile', path: '/profile' }
  ];

  // Add Dashboard menu item if user is admin
  if (currentUser?.isAdmin) {
    menuItems.push({ icon: LayoutDashboard, text: 'Dashboard', path: '/dashboard' });
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  React.useEffect(() => {
    closeMobileMenu();
  }, [location]);

  const handleLogoDoubleClick = () => {
    if (currentUser?.isAdmin) {
      navigate('/dashboard');
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white dark:bg-black p-2 flex items-center justify-between z-50 border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={toggleMobileMenu}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        </button>
        <RouterLink to="/" className="flex-grow text-center">
          <img
            src={theme === 'dark' ? '/white.svg' : '/black.svg'}
            alt="Logo"
            className="h-10 w-auto mx-auto"
            onDoubleClick={handleLogoDoubleClick}
          />
        </RouterLink>
        <div className="w-10">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Drawer */}
      <div 
        className={`md:hidden fixed top-0 left-0 h-full w-[275px] bg-white dark:bg-black z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <button 
              onClick={closeMobileMenu}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
            <RouterLink to="/" className="flex-grow text-center">
              <img
                src={theme === 'dark' ? '/white.svg' : '/black.svg'}
                alt="Logo"
                className="h-8 w-auto mx-auto"
              />
            </RouterLink>
            <div className="w-10">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Drawer Content */}
          <div className="flex-1 overflow-y-auto py-2">
            {menuItems.map((item) => (
              <Link
                key={item.text}
                Icon={item.icon}
                text={item.text}
                path={item.path}
                onClick={closeMobileMenu}
              />
            ))}
          </div>

          {/* Mobile Drawer Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            {currentUser ? (
              <button
                onClick={() => { handleLogout(); closeMobileMenu(); }}
                className="w-full py-3 px-4 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition flex items-center justify-center space-x-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={() => { setIsAuthOpen(true); closeMobileMenu(); }}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-[275px] bg-white dark:bg-black">
        <div className="flex flex-col h-full">
          {/* Desktop Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <RouterLink to="/">
              <img
                src={theme === 'dark' ? '/white.svg' : '/black.svg'}
                alt="Logo"
                className="h-12 w-auto"
                onDoubleClick={handleLogoDoubleClick}
              />
            </RouterLink>
            <ThemeToggle />
          </div>

          {/* Desktop Content */}
          <div className="flex-1 overflow-y-auto py-2">
            {menuItems.map((item) => (
              <Link
                key={item.text}
                Icon={item.icon}
                text={item.text}
                path={item.path}
              />
            ))}
          </div>

          {/* Desktop Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition flex items-center justify-center space-x-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </>
  );
}
