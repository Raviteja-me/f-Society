import { Feed } from '../components/Feed';

export function Home() {
  return (
    <div className="flex-1 flex flex-col bg-transparent">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <h1 className="text-xl font-bold p-4 text-white">Home</h1>
      </div>

      {/* Feed Content */}
      <div className="flex-1">
        <Feed />
      </div>
    </div>
  );
} 