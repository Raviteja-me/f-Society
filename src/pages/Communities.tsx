import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Video, Link } from 'lucide-react';

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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'community_posts'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const postsData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as CommunityPost[];
      setPosts(postsData);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser || !newPostContent.trim()) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      const newPost = {
        content: newPostContent,
        authorId: currentUser.uid,
        authorName: userData?.name || 'Anonymous',
        authorAvatar: userData?.photoURL || '',
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
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'community_posts', postId);
      const post = posts.find(p => p.id === postId);

      if (post?.likes.includes(currentUser.uid)) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid),
          'stats.likes': post.stats.likes - 1
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid),
          'stats.likes': (post?.stats.likes || 0) + 1
        });
      }

      fetchPosts();
    } catch (err) {
      console.error('Error updating like:', err);
      setError('Failed to update like');
    }
  };

  const handleComment = async (postId: string, comment: string) => {
    if (!currentUser || !comment.trim()) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      const newComment = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        userName: userData?.name || 'Anonymous',
        userAvatar: userData?.photoURL || '',
        content: comment,
        timestamp: new Date()
      };

      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment),
        'stats.comments': (posts.find(p => p.id === postId)?.stats.comments || 0) + 1
      });

      fetchPosts();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold p-4 dark:text-white">Communities</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full">
        {/* Create Post */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share your thoughts with the community..."
            className="w-full h-32 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
          />
          
          <div className="mt-2 flex items-center space-x-2">
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as 'image' | 'video' | 'link')}
              className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreatePost}
              disabled={!newPostContent.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Post
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
                        />
                      )}
                      {media.type === 'video' && (
                        <video
                          src={media.url}
                          controls
                          className="max-h-96 rounded-lg"
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
              <div className="mt-4 space-y-2">
                {post.comments.map(comment => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full"
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