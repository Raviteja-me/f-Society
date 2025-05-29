import { useState, useRef } from 'react';
import { collection, addDoc, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { Plus, Image, Video, File, Edit2, Trash2, X } from 'lucide-react';
import { Post } from './types';
import { useAuth } from '../../context/AuthContext';

interface PostsTabProps {
  posts: Post[];
  setError: (error: string) => void;
  fetchPosts: () => Promise<void>;
}

export function PostsTab({ posts, setError, fetchPosts }: PostsTabProps) {
  const { currentUser } = useAuth();
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (userId: string) => {
    const uploadedFiles = [];
    for (const file of selectedFiles) {
      const fileRef = ref(storage, `uploads/${userId}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      uploadedFiles.push({
        url,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'file',
        name: file.name
      });
    }
    return uploadedFiles;
  };

  const handleCreatePost = async () => {
    if (!currentUser) return;
    
    try {
      setUploading(true);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      const media = selectedFiles.length > 0 ? await uploadFiles(currentUser.uid) : [];
      
      const newPost = {
        content: newPostContent,
        authorId: currentUser.uid,
        authorName: userData?.name || 'Admin',
        authorAvatar: userData?.photoURL || '',
        timestamp: new Date(),
        media,
        stats: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

      await addDoc(collection(db, 'posts'), newPost);
      setNewPostContent('');
      setSelectedFiles([]);
      setShowNewPostModal(false);
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const handleEditPost = async (post: Post) => {
    setEditingPost(post);
    setNewPostContent(post.content);
    setShowNewPostModal(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !currentUser) return;

    try {
      setUploading(true);
      const media = selectedFiles.length > 0 ? await uploadFiles(currentUser.uid) : editingPost.media;

      await updateDoc(doc(db, 'posts', editingPost.id), {
        content: newPostContent,
        media,
        updatedAt: new Date()
      });

      setNewPostContent('');
      setSelectedFiles([]);
      setEditingPost(null);
      setShowNewPostModal(false);
      fetchPosts();
    } catch (err) {
      console.error('Error updating post:', err);
      setError('Failed to update post');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await deleteDoc(doc(db, 'posts', postId));
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold dark:text-white">Posts Management</h2>
        <button
          onClick={() => {
            setEditingPost(null);
            setNewPostContent('');
            setSelectedFiles([]);
            setShowNewPostModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" />
          <span>New Post</span>
        </button>
      </div>
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="border dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
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
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditPost(post)}
                  className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  title="Edit Post"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title="Delete Post"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="dark:text-white mb-2">{post.content}</p>
            {post.media && post.media.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {post.media.map((media, index) => (
                  <div key={index} className="relative">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={`Media ${index + 1}`}
                        className="w-full rounded-lg"
                      />
                    ) : media.type === 'video' ? (
                      <video
                        src={media.url}
                        controls
                        className="w-full rounded-lg"
                      />
                    ) : (
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                      >
                        <File className="h-5 w-5" />
                        <span className="text-sm truncate">{media.filename}</span>
                      </a>
                    )}
                  </div>
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
              <h3 className="text-xl font-semibold dark:text-white">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </h3>
              <button
                onClick={() => {
                  setShowNewPostModal(false);
                  setEditingPost(null);
                  setNewPostContent('');
                  setSelectedFiles([]);
                }}
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
            
            {/* File Upload Section */}
            <div className="mt-4">
              <div className="flex space-x-2 mb-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Image className="h-5 w-5" />
                  <span>Add Media</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.apk"
                  className="hidden"
                />
              </div>
              
              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {file.type.startsWith('image/') ? (
                          <Image className="h-5 w-5" />
                        ) : file.type.startsWith('video/') ? (
                          <Video className="h-5 w-5" />
                        ) : (
                          <File className="h-5 w-5" />
                        )}
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowNewPostModal(false);
                  setEditingPost(null);
                  setNewPostContent('');
                  setSelectedFiles([]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingPost ? handleUpdatePost : handleCreatePost}
                disabled={uploading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : editingPost ? 'Update' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 