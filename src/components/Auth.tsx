import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const { signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const user = await signInWithGoogle();
      if (user) {
        onClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>

        <div className="flex flex-col items-center space-y-6">
          <img
            src={theme === 'dark' ? '/white.svg' : '/black.svg'}
            alt="Logo"
            className="h-10 w-30"
          />

          <h1 className="text-3xl font-bold dark:text-white">Sign In</h1>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`flex items-center justify-center space-x-2 w-full py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-full transition ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white"></div>
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
                <span className="dark:text-white">Continue with Google</span>
              </>
            )}
          </button>

          <div className="flex items-center w-full">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
            <span className="px-4 text-gray-500 dark:text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold transition ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-900 dark:hover:bg-gray-100'
            }`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-black mx-auto"></div>
            ) : (
              'Create account'
            )}
          </button>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            By signing up, you agree to the Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
