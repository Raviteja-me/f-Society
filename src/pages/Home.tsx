import { useState } from 'react';
import { Feed } from '../components/Feed';
import { CreatePost } from '../components/CreatePost';


export function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex-1 flex justify-center overflow-y-auto">
      <div className="w-full max-w-2xl">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800">
          <h1 className="text-xl font-bold p-4 text-white">Home</h1>
        </div>

        {/* Create Post */}
        <div className="px-4 py-4">
          <CreatePost onPostCreated={handlePostCreated} />
        </div>

        {/* Feed Content */}
        <div className="px-4">
          <Feed key={refreshKey} />
        </div>
      </div>

      {/* Right Section - This section should be managed by the parent layout for fixed positioning */}
      {/* Keeping it here for now as a placeholder or if the parent layout expects content */}      
      {/* This content will be rendered but its fixed positioning needs to be handled by the main App layout */} 
    </div>
  );
} 