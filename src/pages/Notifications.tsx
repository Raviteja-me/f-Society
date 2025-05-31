export function Notifications() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-black">
      <div className="sticky top-16 md:top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold p-4 text-gray-900 dark:text-white">Notifications</h1>
      </div>
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-400">No new notifications</p>
      </div>
    </div>
  );
} 