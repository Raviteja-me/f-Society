import React, { useState } from 'react';
import { Home, Search, Bell, Mail, BookOpen, Users, BadgeCheck, User, LogOut, Menu, ArrowLeft } from 'lucide-react';
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
    { icon: Search, text: 'Explore', path: '/explore' },
    { icon: Bell, text: 'Notifications', path: '/notifications' },
    { icon: Mail, text: 'Messages', path: '/messages' },
    { icon: BookOpen, text: 'Courses', path: '/courses' },
    { icon: Users, text: 'Communities', path: '/communities' },
    { icon: BadgeCheck, text: 'Verified', path: '/verified' },
    { icon: User, text: 'Profile', path: '/profile' }
  ];

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
    if (currentUser) {
      navigate('/dashboard');
    }
  };

  return (
    <>
      {/* Mobile Header */}
      {!isMobileMenuOpen && (
        <div className="md:hidden fixed top-0 left-0 w-full bg-white dark:bg-black p-2 flex items-center justify-between z-50">
          <RouterLink to="/" className="flex-grow text-center">
            <img
              src={theme === 'dark' ? '/white.svg' : '/black.svg'}
              alt="Logo"
              className="h-12 w-auto mx-auto"
              onDoubleClick={handleLogoDoubleClick}
            />
          </RouterLink>
          <button onClick={toggleMobileMenu} className="p-2">
            <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed h-screen w-64 bg-white dark:bg-black md:block ${isMobileMenuOpen ? 'block z-40' : 'hidden md:flex'}`}>
        <div className="flex flex-col h-full">
          <div className="space-y-2 p-2">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between px-2">
              <RouterLink to="/">
                <img
                  src={theme === 'dark' ? '/white.svg' : '/black.svg'}
                  alt="Logo"
                  className="h-15 w-auto"
                  onDoubleClick={handleLogoDoubleClick}
                />
              </RouterLink>
              <ThemeToggle />
            </div>

            {/* Mobile Sidebar Content */}
            {isMobileMenuOpen && (
              <>
                <div className="md:hidden flex flex-col items-start p-2">
                  <div className="flex items-center justify-between w-full mb-2">
                    <button onClick={closeMobileMenu} className="p-2">
                      <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    </button>
                    <RouterLink to="/" className="flex-grow text-center">
                      <img
                        src={theme === 'dark' ? '/white.svg' : '/black.svg'}
                        alt="Logo"
                        className="h-8 w-auto"
                        style={{ maxHeight: '2rem', overflow: 'hidden' }}
                      />
                    </RouterLink>
                    <div className="flex justify-end">
                      <ThemeToggle />
                    </div>
                  </div>
                </div>

                {menuItems.map((item) => (
                  <Link
                    key={item.text}
                    Icon={item.icon}
                    text={item.text}
                    path={item.path}
                    onClick={closeMobileMenu}
                  />
                ))}

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
              </>
            )}

            {/* Desktop Sidebar Content */}
            {!isMobileMenuOpen && (
              <div className="hidden md:block">
                {menuItems.map((item) => (
                  <Link
                    key={item.text}
                    Icon={item.icon}
                    text={item.text}
                    path={item.path}
                  />
                ))}

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
