import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { Upload, X, FileText, Video, Image as ImageIcon } from 'lucide-react';

interface MediaFile {
  file: File;
  type: 'image' | 'video' | 'file';
  preview?: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [users, setUsers] = useState([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersData = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsers(usersData);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const files = Array.from(event.target.files || []);
    
    const newMediaFiles = files.map(file => ({
      file,
      type,
      preview: type === 'image' ? URL.createObjectURL(file) : undefined
    }));

    setMediaFiles(prev => [...prev, ...newMediaFiles]);
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadToStorage = async (file: File) => {
    const timestamp = Date.now();
    const storageRef = ref(storage, `uploads/${currentUser?.uid}/${timestamp}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handlePost = async () => {
    if (!currentUser || !content.trim()) return;
    setIsUploading(true);

    try {
      // Upload all files to storage and get URLs
      const mediaUrls = await Promise.all(
        mediaFiles.map(async ({ file, type }) => {
          const url = await uploadToStorage(file);
          return {
            type,
            url,
            filename: file.name,
            size: file.size,
            mimeType: file.type
          };
        })
      );

      // Create post document
      await addDoc(collection(db, 'posts'), {
        content,
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorAvatar: currentUser.photoURL,
        timestamp: new Date(),
        media: mediaUrls,
        stats: {
          likes: 0,
          shares: 0,
          comments: 0
        },
        interactions: [] // Will store user interactions
      });

      setContent('');
      setMediaFiles([]);
    } catch (error) {
      console.error('Error posting:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold dark:text-white">Dashboard</h1>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
        >
          Back to Home
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
        <div className="flex space-x-4">
          <img 
            src={currentUser?.photoURL || 'https://via.placeholder.com/40'} 
            alt="Profile" 
            className="h-12 w-12 rounded-full"
          />
          <div className="flex-1 space-y-4">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              className="w-full resize-none border border-gray-200 dark:border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 text-xl bg-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={3}
            />

            {/* File Upload Buttons */}
            <div className="flex space-x-4">
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => handleFileSelect(e, 'image')}
                  className="hidden"
                  id="image-upload"
                  accept="image/*"
                  multiple
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span>Images</span>
                </label>
              </div>

              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => handleFileSelect(e, 'video')}
                  className="hidden"
                  id="video-upload"
                  accept="video/*"
                  multiple
                />
                <label
                  htmlFor="video-upload"
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Video className="h-5 w-5" />
                  <span>Videos</span>
                </label>
              </div>

              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => handleFileSelect(e, 'file')}
                  className="hidden"
                  id="file-upload"
                  multiple
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <FileText className="h-5 w-5" />
                  <span>Files</span>
                </label>
              </div>
            </div>

            {/* Selected Files Preview */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mediaFiles.map((media, index) => (
                  <div key={index} className="relative group">
                    {media.type === 'image' && media.preview ? (
                      <img
                        src={media.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <FileText className="h-8 w-8 text-gray-500" />
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-sm text-gray-500 mt-1 truncate">{media.file.name}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button 
                onClick={handlePost}
                disabled={isUploading || (!content.trim() && mediaFiles.length === 0)}
                className="px-8 py-3 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Section with enhanced UI */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Community Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user: any) => (
            <div key={user.id} className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl hover:shadow-md transition">
              <div className="flex items-center space-x-4">
                <img 
                  src={user.photoURL || 'https://via.placeholder.com/40'} 
                  alt={user.displayName} 
                  className="h-16 w-16 rounded-full border-4 border-white dark:border-gray-800"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-lg font-bold dark:text-white">{user.displayName}</p>
                    {user.isPremium && (
                      <span className="text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-1 rounded-full">PRO</span>
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}