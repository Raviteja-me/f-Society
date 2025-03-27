import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { theme } = useTheme();
  const { signInWithGoogle } = useAuth();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>

        <div className="flex flex-col items-center space-y-6">
          <img 
            src={theme === 'dark' ? '/white.svg' : '/black.svg'} 
            alt="Logo"
            className="h-8 w-8"
          />

          <h1 className="text-3xl font-bold dark:text-white">Sign in to Y-Society</h1>

          <button
            onClick={signInWithGoogle}
            className="flex items-center justify-center space-x-2 w-full py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
            <span className="dark:text-white">Continue with Google</span>
          </button>

          <div className="flex items-center w-full">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
            <span className="px-4 text-gray-500 dark:text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold hover:bg-gray-900 dark:hover:bg-gray-100 transition"
          >
            Create account
          </button>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            By signing up, you agree to the Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}