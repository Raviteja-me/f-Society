import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Feed } from './components/Feed';
import { Widgets } from './components/Widgets';
import { Dashboard } from './components/Dashboard';
import { AdminRoute } from './components/AdminRoute';

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Routes>
        <Route path="/" element={
          <div className="flex justify-center">
            <div className="flex w-full max-w-[1265px]">
              <Sidebar />
              <main className="ml-0 md:ml-[275px] flex-1 flex">
                <div className="w-full md:w-[600px] border-x border-gray-200 dark:border-gray-800">
                  <Feed />
                </div>
                <div className="hidden lg:block w-[350px] pl-8">
                  <Widgets />
                </div>
              </main>
            </div>
          </div>
        } />
        <Route path="/dashboard" element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;