import { Feed } from '../components/Feed';

export function Home() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold p-4 dark:text-white">Home</h1>
      </div>

      {/* Feed Content */}
      <div className="flex-1">
        <Feed />
      </div>
    </div>
  );
} 