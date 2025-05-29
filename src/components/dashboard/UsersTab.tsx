import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Send } from 'lucide-react';
import { User } from './types';

interface UsersTabProps {
  users: User[];
  setError: (error: string) => void;
}

export function UsersTab({ users, setError }: UsersTabProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleSendNotification = async (userId: string) => {
    try {
      if (!notificationMessage.trim()) return;

      await addDoc(collection(db, 'notifications'), {
        userId,
        message: notificationMessage,
        type: 'admin_notification',
        createdAt: new Date(),
        read: false
      });

      setNotificationMessage('');
      setSelectedUser(null);
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('Failed to send notification');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">User Management</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2 dark:text-white">User</th>
              <th className="text-left py-2 dark:text-white">Email</th>
              <th className="text-left py-2 dark:text-white">Role</th>
              <th className="text-left py-2 dark:text-white">Joined</th>
              <th className="text-left py-2 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b dark:border-gray-700">
                <td className="py-2">
                  <div className="flex items-center space-x-2">
                    <img
                      src={user.photoURL}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="dark:text-white">{user.name}</span>
                  </div>
                </td>
                <td className="py-2 dark:text-white">{user.email}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="py-2 dark:text-white">{user.createdAt.toLocaleDateString()}</td>
                <td className="py-2">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Send Notification"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Send Notification Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold dark:text-white">
                Send Notification to {selectedUser.name}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              className="w-full h-32 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Write your notification message..."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendNotification(selectedUser.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 