import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase.ts';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Share2, Loader2, Image as ImageIcon, Link as LinkIcon, Video, Users, Upload, X } from 'lucide-react';

interface CommunityPost {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  timestamp: Date;
  media?: Array<{
    type: 'image' | 'video' | 'link';
    url: string;
    preview?: string;
  }>;
  likes: string[];
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    content: string;
    timestamp: Date;
  }>;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export function Community() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'link'>('image');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'community_posts'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const postsData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as CommunityPost[];
      setPosts(postsData);
      setError('');
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to fetch posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const validateMediaUrl = (url: string, type: 'image' | 'video' | 'link'): boolean => {
    try {
      const parsedUrl = new URL(url);
      if (type === 'image') {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(parsedUrl.pathname);
      } else if (type === 'video') {
        return /\.(mp4|webm|ogg)$/i.test(parsedUrl.pathname);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError('File size must be less than 50MB');
        return;
      }

      if (file.type.startsWith('image/')) {
        setMediaType('image');
      } else if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else {
        setError('Only image and video files are allowed');
        return;
      }

      setMediaFile(file);
      setMediaUrl('');
    }
  };

  const handleUpload = async () => {
    if (!mediaFile || !currentUser) return;

    setUploading(true);
    setError('');

    try {
      const storageRef = ref(storage, `community_media/${currentUser.uid}/${Date.now()}_${mediaFile.name}`);
      await uploadBytes(storageRef, mediaFile);
      const downloadURL = await getDownloadURL(storageRef);
      setMediaUrl(downloadURL);
      setMediaFile(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser) {
      setError('Please log in to create posts');
      return;
    }

    if (!newPostContent.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    if (mediaFile) {
      await handleUpload();
    }

    if (mediaUrl && !validateMediaUrl(mediaUrl, mediaType)) {
      setError(`Invalid ${mediaType} URL format`);
      return;
    }

    setPosting(true);
    setError('');

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      if (!userData) {
        throw new Error('User data not found');
      }

      const newPost = {
        content: newPostContent,
        authorId: currentUser.uid,
        authorName: userData.name || 'Anonymous',
        authorAvatar: userData.photoURL || '',
        timestamp: new Date(),
        media: mediaUrl ? [{
          type: mediaType,
          url: mediaUrl,
          preview: mediaType === 'link' ? mediaUrl : undefined
        }] : [],
        likes: [],
        comments: [],
        stats: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

      await addDoc(collection(db, 'community_posts'), newPost);
      setNewPostContent('');
      setMediaUrl('');
      setMediaFile(null);
      setMediaType('image');
      await fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      setError('Please log in to like posts');
      return;
    }

    try {
      const postRef = doc(db, 'community_posts', postId);
      const post = posts.find(p => p.id === postId);

      if (!post) {
        throw new Error('Post not found');
      }

      if (post.likes.includes(currentUser.uid)) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid),
          'stats.likes': post.stats.likes - 1
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid),
          'stats.likes': (post.stats.likes || 0) + 1
        });
      }

      await fetchPosts();
    } catch (err) {
      console.error('Error updating like:', err);
      setError('Failed to update like');
    }
  };

  const handleComment = async (postId: string) => {
    if (!currentUser) {
      setError('Please log in to comment');
      return;
    }

    const comment = commentText[postId]?.trim();
    if (!comment) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      if (!userData) {
        throw new Error('User data not found');
      }

      const newComment = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        userName: userData.name || 'Anonymous',
        userAvatar: userData.photoURL || '',
        content: comment,
        timestamp: new Date()
      };

      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment),
        'stats.comments': (posts.find(p => p.id === postId)?.stats.comments || 0) + 1
      });

      setCommentText({ ...commentText, [postId]: '' });
      await fetchPosts();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-transparent">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <h1 className="text-xl font-bold p-4 text-white">Community</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 text-red-200 border-b border-red-800">
          {error}
        </div>
      )}

      <div className="max-w-2xl mx-auto w-full">
        {/* Community Introduction */}
        <div className="p-4 bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 shadow-xl mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Welcome to FSociety Community</h2>
              <p className="text-sm text-gray-400">Join the conversation with fellow learners</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-white">{posts.length}</div>
              <div className="text-sm text-gray-400">Posts</div>
            </div>
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {posts.reduce((acc, post) => acc + post.stats.comments, 0)}
              </div>
              <div className="text-sm text-gray-400">Comments</div>
            </div>
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {posts.reduce((acc, post) => acc + post.stats.likes, 0)}
              </div>
              <div className="text-sm text-gray-400">Likes</div>
            </div>
          </div>
        </div>

        {/* Create Post */}
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4 mb-6">
          <div className="flex space-x-3">
            <img
              src={currentUser?.photoURL || 'https://via.placeholder.com/40'}
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-20 p-2 border border-gray-700/50 rounded-lg bg-transparent text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                disabled={posting}
              />
              
              <div className="mt-2 flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setMediaType('image');
                      fileInputRef.current?.click();
                    }}
                    className={`p-2 rounded-full ${
                      mediaType === 'image' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800/50'
                    }`}
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setMediaType('video');
                      setMediaFile(null);
                      setMediaUrl('');
                    }}
                    className={`p-2 rounded-full ${
                      mediaType === 'video' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800/50'
                    }`}
                  >
                    <Video className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setMediaType('link');
                      setMediaFile(null);
                    }}
                    className={`p-2 rounded-full ${
                      mediaType === 'link' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800/50'
                    }`}
                  >
                    <LinkIcon className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <button
                  onClick={handleCreatePost}
                  disabled={posting || !newPostContent.trim() || (mediaFile !== null && uploading)}
                  className="px-4 py-2 bg-blue-500/80 text-white rounded-full hover:bg-blue-600/80 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {posting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <span>Post</span>
                  )}
                </button>
              </div>

              {mediaFile && (
                <div className="mt-2 p-2 bg-gray-800/30 rounded-lg border border-gray-700/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{mediaFile.name}</span>
                  </div>
                  <button
                    onClick={() => setMediaFile(null)}
                    className="p-1 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {(mediaType === 'link' || mediaType === 'video') && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder={mediaType === 'video' ? "Enter video URL or upload a file" : "Enter URL"}
                    className="w-full p-2 border border-gray-700/50 rounded-lg bg-transparent text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    disabled={posting}
                  />
                  {mediaType === 'video' && (
                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1 text-sm bg-gray-800/50 text-gray-300 rounded-full hover:bg-gray-700/50 transition-colors"
                      >
                        Upload Video
                      </button>
                      <span className="text-xs text-gray-500">(Max 50MB)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
              <div className="p-4">
                <div className="flex space-x-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{post.authorName}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-400">
                        {post.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-white mt-1">{post.content}</p>

                    {post.media && post.media.length > 0 && (
                      <div className="mt-3">
                        {post.media.map((media, index) => (
                          <div key={index} className="rounded-lg overflow-hidden">
                            {media.type === 'image' && (
                              <img
                                src={media.url}
                                alt="Post media"
                                className="max-h-96 w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                }}
                              />
                            )}
                            {media.type === 'video' && (
                              <video
                                src={media.url}
                                controls
                                className="max-h-96 w-full"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Video+Not+Found';
                                }}
                              />
                            )}
                            {media.type === 'link' && (
                              <a
                                href={media.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                {media.url}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-6 mt-3 text-gray-400">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1 ${
                          post.likes.includes(currentUser?.uid || '') ? 'text-red-500' : 'hover:text-red-400'
                        }`}
                      >
                        <Heart className="h-5 w-5" />
                        <span>{post.stats.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-400">
                        <MessageCircle className="h-5 w-5" />
                        <span>{post.stats.comments}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-400">
                        <Share2 className="h-5 w-5" />
                        <span>{post.stats.shares}</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-4 space-y-4">
                      <div className="flex space-x-2">
                        <img
                          src={currentUser?.photoURL || 'https://via.placeholder.com/32'}
                          alt="Your profile"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={commentText[post.id] || ''}
                            onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                            placeholder="Write a comment..."
                            className="w-full p-2 border border-gray-700/50 rounded-full bg-transparent text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={() => handleComment(post.id)}
                          disabled={!commentText[post.id]?.trim()}
                          className="px-4 py-2 bg-blue-500/80 text-white rounded-full hover:bg-blue-600/80 disabled:opacity-50 transition-colors"
                        >
                          Comment
                        </button>
                      </div>

                      {post.comments.map(comment => (
                        <div key={comment.id} className="flex space-x-2">
                          <img
                            src={comment.userAvatar}
                            alt={comment.userName}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/32?text=U';
                            }}
                          />
                          <div className="flex-1">
                            <div className="bg-gray-800/50 rounded-2xl px-4 py-2">
                              <p className="font-medium text-white">{comment.userName}</p>
                              <p className="text-sm text-gray-300">{comment.content}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 ml-4">
                              {comment.timestamp.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 