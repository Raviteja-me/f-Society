import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Notifications } from './pages/Notifications';
import { Messages } from './pages/Messages';
import { Communities } from './pages/Communities';
import { Profile } from './pages/Profile';
import { Verified } from './pages/Verified';
import { Courses } from './pages/Courses';
import { Dashboard } from './pages/Dashboard';
import { AdminRoute } from './components/AdminRoute';
import { Widgets } from './components/Widgets';

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Mobile Header and Drawer */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50">
        <Sidebar />
      </div>

      {/* Main Content - Always visible (mobile & desktop) */}
      <div className="w-full md:hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/verified" element={<Verified />} />
          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </div>

      {/* Desktop Layout - Only visible on md and up */}
      <div className="hidden md:flex justify-center w-full">
        <div className="flex max-w-6xl mx-auto">
          {/* Sidebar (not fixed) */}
          <div className="hidden md:block md:w-[275px] bg-white dark:bg-black">
            <Sidebar />
          </div>

          {/* Main Content - Centered Feed */}
          <div className="flex-1 max-w-[600px] border-x border-gray-200 dark:border-gray-800 min-h-screen">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/verified" element={<Verified />} />
              <Route
                path="/dashboard"
                element={
                  <AdminRoute>
                    <Dashboard />
                  </AdminRoute>
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
    </div>
  );
}

export default App;
