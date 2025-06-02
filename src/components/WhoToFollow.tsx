import { UserPlus } from 'lucide-react';

export function WhoToFollow() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Who to follow</h2>
      <div className="space-y-4">
        {/* Placeholder for suggested users */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">User Name</p>
              <p className="text-sm text-gray-500">@username</p>
            </div>
          </div>
          <button className="px-4 py-1 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold hover:opacity-90 transition">
            Follow
          </button>
        </div>
      </div>
    </div>
  );
} 