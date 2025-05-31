import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';

import { Notifications } from './pages/Notifications';

import { Community } from './pages/Communities';
import { Profile } from './pages/Profile';
import { API } from './pages/API';
import { Courses } from './pages/Courses';
import { CourseView } from './pages/CourseView';
import { Dashboard } from './pages/Dashboard';
import { AdminRoute } from './components/AdminRoute';
import { Widgets } from './components/Widgets';

function App() {
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
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/communities" element={<Community />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/course/:courseId" element={<CourseView />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/api" element={<API />} />
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
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/communities" element={<Community />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/course/:courseId" element={<CourseView />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/api" element={<API />} />
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
