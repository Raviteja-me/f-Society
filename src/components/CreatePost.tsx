import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Image, Video, X, Loader2 } from 'lucide-react';
import { auth } from '../firebase';

interface CreatePostProps {
  onPostCreated: () => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isImageValid = isImage && file.size <= 20 * 1024 * 1024; // 20MB
      const isVideoValid = isVideo && file.size <= 75 * 1024 * 1024; // 75MB
      
      if (!isImageValid && !isVideoValid) {
        setError(`File ${file.name} is too large. Images must be under 20MB and videos under 75MB.`);
        return false;
      }
      return true;
    });

    setMedia(prev => [...prev, ...validFiles]);
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    setError('');

    try {
      // Check if user has completed their profile
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      if (!userData?.website) {
        setError('Please add your website to your profile before posting.');
        setIsLoading(false);
        return;
      }

      // Upload media files
      const mediaUrls = await Promise.all(
        media.map(async (file) => {
          if (!currentUser) {
            throw new Error('User must be authenticated to upload files');
          }
          
          try {
            console.log('Starting upload for file:', file.name);
            console.log('File type:', file.type);
            console.log('File size:', file.size);
            console.log('Current user:', currentUser.uid);
            console.log('Auth state:', auth.currentUser);
            
            // Verify authentication state
            if (!auth.currentUser) {
              throw new Error('No authenticated user found');
            }
            
            const storageRef = ref(storage, `community_media/${currentUser.uid}/${Date.now()}_${file.name}`);
            console.log('Storage path:', storageRef.fullPath);
            
            const metadata = {
              contentType: file.type,
              customMetadata: {
                uploadedBy: currentUser.uid,
                uploadedAt: new Date().toISOString()
              }
            };
            
            console.log('Uploading with metadata:', metadata);
            const snapshot = await uploadBytes(storageRef, file, metadata);
            console.log('Upload successful:', snapshot);
            
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log('Download URL:', downloadURL);
            
            return {
              url: downloadURL,
              type: file.type.startsWith('image/') ? 'image' : 'video',
              filename: file.name
            };
          } catch (uploadError: any) {
            console.error('Detailed upload error:', uploadError);
            console.error('Error code:', uploadError.code);
            console.error('Error message:', uploadError.message);
            console.error('Auth state during error:', auth.currentUser);
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }
        })
      );

      // Create post
      await addDoc(collection(db, 'posts'), {
        content: content.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorAvatar: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        media: mediaUrls,
        likes: [],
        comments: [],
        stats: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      });

      // Reset form
      setContent('');
      setMedia([]);
      onPostCreated();
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          className="w-full p-2 bg-transparent border-none focus:ring-0 resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          rows={3}
        />

        {/* Media Preview */}
        {media.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {media.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-2 text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
            >
              <Image className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
            >
              <Video className="h-5 w-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || (!content.trim() && media.length === 0)}
            className="px-4 py-2 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <span>Post</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 