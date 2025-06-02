import { Search } from 'lucide-react';

export function SearchBar() {
  return (
    <div className="sticky top-0 p-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search"
          className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full border-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-500"
        />
      </div>
    </div>
  );
} 