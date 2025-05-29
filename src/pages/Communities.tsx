import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Share2, Loader2 } from 'lucide-react';

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

export function Communities() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'link'>('image');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

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

  const handleCreatePost = async () => {
    if (!currentUser) {
      setError('Please log in to create posts');
      return;
    }

    if (!newPostContent.trim()) {
      setError('Post content cannot be empty');
      return;
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
    <div className="flex-1 flex flex-col">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold p-4 dark:text-white">Communities</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="p-4 max-w-2xl mx-auto w-full">
        {/* Create Post */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share your thoughts with the community..."
            className="w-full h-32 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            disabled={posting}
          />
          
          <div className="mt-2 flex items-center space-x-2">
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as 'image' | 'video' | 'link')}
              className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={posting}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="link">Link</option>
            </select>
            <input
              type="text"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Enter media URL"
              className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={posting}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreatePost}
              disabled={posting || !newPostContent.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
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
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium dark:text-white">{post.authorName}</p>
                  <p className="text-sm text-gray-500">
                    {post.timestamp.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="dark:text-white mb-4">{post.content}</p>

              {post.media && post.media.length > 0 && (
                <div className="mb-4">
                  {post.media.map((media, index) => (
                    <div key={index} className="mb-2">
                      {media.type === 'image' && (
                        <img
                          src={media.url}
                          alt="Post media"
                          className="max-h-96 rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                          }}
                        />
                      )}
                      {media.type === 'video' && (
                        <video
                          src={media.url}
                          controls
                          className="max-h-96 rounded-lg"
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
                          className="text-blue-500 hover:underline"
                        >
                          {media.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-4 text-gray-500">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-1 ${
                    post.likes.includes(currentUser?.uid || '') ? 'text-red-500' : ''
                  }`}
                >
                  <Heart className="h-5 w-5" />
                  <span>{post.stats.likes}</span>
                </button>
                <button className="flex items-center space-x-1">
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.stats.comments}</span>
                </button>
                <button className="flex items-center space-x-1">
                  <Share2 className="h-5 w-5" />
                  <span>{post.stats.shares}</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="mt-4 space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={commentText[post.id] || ''}
                    onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                    placeholder="Write a comment..."
                    className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    disabled={!commentText[post.id]?.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    Comment
                  </button>
                </div>

                {post.comments.map(comment => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/32?text=U';
                      }}
                    />
                    <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                      <p className="font-medium dark:text-white">{comment.userName}</p>
                      <p className="text-sm dark:text-gray-300">{comment.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {comment.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 