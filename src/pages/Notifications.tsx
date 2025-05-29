export function Notifications() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold p-4 dark:text-white">Notifications</h1>
      </div>
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-400">No new notifications</p>
      </div>
    </div>
  );
} 