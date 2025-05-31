import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { API } from './pages/API';
import { Courses } from './pages/Courses';
import { CourseView } from './pages/CourseView';
import { Dashboard } from './pages/Dashboard';
import { Apps } from './pages/Apps';
import { AdminRoute } from './components/AdminRoute';
import { Widgets } from './components/Widgets';
import { useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';
import { AuthModal } from './components/Auth';

function App() {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [intendedPath, setIntendedPath] = useState<string | null>(null);

  // Check if the current route is protected
  // For simplicity, assume all routes except '/' are protected for now.
  // A more robust solution might involve a list of protected paths.
  const isProtectedRoute = location.pathname !== '/';

  // Effect to handle opening the auth modal when unauthenticated user hits a protected route
  useEffect(() => {
    // Only trigger if authLoading is false (auth state is determined)
    if (!authLoading && !currentUser && isProtectedRoute) {
      setIntendedPath(location.pathname);
      setIsAuthOpen(true);
    }
    // Note: We are no longer navigating to '/' here immediately.
    // The ProtectedRoute component will handle the actual navigation if needed.

  }, [currentUser, authLoading, location.pathname, isProtectedRoute]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    // While auth state is loading, render nothing or a loading indicator
    if (authLoading) {
      return null; // Or return a loading spinner component
    }

    // Once auth state is loaded, check if user is authenticated
    if (!currentUser) {
      // User is not authenticated, redirect to home (where modal will be handled)
      // Using Navigate component is preferred over window.location.href for react-router
      return <Navigate to="/" replace />;
    }

    // User is authenticated, render the protected content
    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex">
      {/* Mobile Header and Drawer */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50">
        <Sidebar />
      </div>

      {/* Main Content - Always visible (mobile & desktop) */}
      <div className="w-full md:hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId"
            element={
              <ProtectedRoute>
                <CourseView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api"
            element={
              <ProtectedRoute>
                <API />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/apps"
            element={
              <ProtectedRoute>
                <Apps />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {/* Desktop Layout - Only visible on md and up */}
      <div className="hidden md:flex justify-center w-full flex-1">
        <div className="flex max-w-7xl mx-auto flex-1">
          {/* Sidebar (not fixed) */}
          <div className="hidden md:block md:w-[275px] bg-white dark:bg-black">
            <Sidebar />
          </div>

          {/* Main Content - Centered Feed */}
          <div className="flex-1 max-w-[800px] w-full border-x border-gray-200 dark:border-gray-800 flex flex-col min-h-screen">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/courses"
                element={
                  <ProtectedRoute>
                    <Courses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/course/:courseId"
                element={
                  <ProtectedRoute>
                    <CourseView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api"
                element={
                  <ProtectedRoute>
                    <API />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <Dashboard />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/apps"
                element={
                  <ProtectedRoute>
                    <Apps />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>

          {/* Right Widgets */}
          <div className="hidden lg:block w-[350px] pl-8 pr-4">
            <Widgets />
          </div>
        </div>
      </div>

      {/* Auth Modal - Always rendered but controlled by isAuthOpen */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          // If user closes the modal without signing in, navigate to home
          // Using Navigate component is preferred.
          if (!currentUser) {
            // window.location.href = '/'; // Replaced with Navigate approach
            // The ProtectedRoute will handle redirection if still on a protected route.
          }
        }}
        onSuccess={() => {
          setIsAuthOpen(false);
          // After successful sign in, redirect to intended path if available
          if (intendedPath && intendedPath !== location.pathname) {
            // Using window.location.href here to force a full page reload
            // to re-evaluate ProtectedRoute and fetch data on the intended page.
            // Alternatively, if state management for data fetching was more robust,
            // a Navigate component could be used.
             window.location.href = intendedPath; // Keeping for now based on current app structure
          } else if (location.pathname === '/') {
             // If they logged in from home, and no intended path, just close modal.
          }
        }}
      />
    </div>
  );
}

export default App;
