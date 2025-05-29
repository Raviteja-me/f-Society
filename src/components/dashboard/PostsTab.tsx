import { useState } from 'react';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus } from 'lucide-react';
import { Post } from './types';

interface PostsTabProps {
  posts: Post[];
  setError: (error: string) => void;
  fetchPosts: () => Promise<void>;
}

export function PostsTab({ posts, setError, fetchPosts }: PostsTabProps) {
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  const handleCreatePost = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', 'current_user_id')); // Replace with actual user ID
      const userData = userDoc.data();
      
      const newPost = {
        content: newPostContent,
        authorId: 'current_user_id', // Replace with actual user ID
        authorName: userData?.name || 'Admin',
        authorAvatar: userData?.photoURL || '',
        timestamp: new Date(),
        media: [],
        stats: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

      await addDoc(collection(db, 'posts'), newPost);
      setNewPostContent('');
      setShowNewPostModal(false);
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold dark:text-white">Posts Management</h2>
        <button
          onClick={() => setShowNewPostModal(true)}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" />
          <span>New Post</span>
        </button>
      </div>
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="border dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-medium dark:text-white">{post.authorName}</span>
              <span className="text-gray-500 text-sm">
                {post.timestamp.toLocaleDateString()}
              </span>
            </div>
            <p className="dark:text-white mb-2">{post.content}</p>
            {post.media && post.media.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {post.media.map((media, index) => (
                  media.type === 'image' ? (
                    <img
                      key={index}
                      src={media.url}
                      alt={`Media ${index + 1}`}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <video
                      key={index}
                      src={media.url}
                      controls
                      className="w-full rounded-lg"
                    />
                  )
                ))}
              </div>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>❤️ {post.stats.likes}</span>
              <span>💬 {post.stats.comments}</span>
              <span>🔄 {post.stats.shares}</span>
            </div>
          </div>
        ))}
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold dark:text-white">Create New Post</h3>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="w-full h-32 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Write your post content..."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowNewPostModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 