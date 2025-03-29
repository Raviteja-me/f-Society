import React, { useState } from 'react';
import { Home, Search, Bell, Mail, BookMarked, ListTodo, Users, BadgeCheck, User, MoreHorizontal, LogOut } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { Link } from './Link';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { AuthModal } from './Auth';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { theme } = useTheme();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  const menuItems = [
    { icon: Home, text: 'Home', path: '/' },
    { icon: Search, text: 'Explore', path: '/explore' },
    { icon: Bell, text: 'Notifications', path: '/notifications' },
    { icon: Mail, text: 'Messages', path: '/messages' },
    { icon: ListTodo, text: 'Lists', path: '/lists' },
    { icon: BookMarked, text: 'Bookmarks', path: '/bookmarks' },
    { icon: Users, text: 'Communities', path: '/communities' },
    { icon: BadgeCheck, text: 'Verified', path: '/verified' },
    { icon: User, text: 'Profile', path: '/profile' },
    { icon: MoreHorizontal, text: 'More', path: '/more' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <div className="fixed h-screen w-64 bg-white dark:bg-gray-900">
        <div className="flex flex-col h-full">
          <div className="space-y-2 p-2">
            <div className="flex items-center justify-between px-2">
              <RouterLink to="/">
                <img 
                  src={theme === 'dark' ? '/white.svg' : '/black.svg'} 
                  alt="Logo"
                  className="h-32 w-22"
                />
              </RouterLink>
              <ThemeToggle />
            </div>
            
            {menuItems.map((item) => (
              <Link key={item.text} Icon={item.icon} text={item.text} path={item.path} />
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
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </>
  );
}