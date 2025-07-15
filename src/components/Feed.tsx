import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase.ts';
import { MessageCircle, Heart, Share, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FileText } from 'lucide-react';
import { AuthModal } from './Auth';
import { LinkPreview } from './LinkPreview';

interface Media {
  type: 'image' | 'video' | 'file';
  url: string;
  filename?: string;
  size?: number;
}

interface Comment {
  id: string;
  uid: string;
  text: string;
  timestamp: string;
  userDisplayName: string;
  userPhotoURL: string;
  createdAt: string;
  likes: string[];
}

interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: any;
  media?: Media[];
  likes: string[];
  comments: Comment[];
  stats: {
    comments: number;
    shares: number;
    likes: number;
  };
}

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentText, setCommentText] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<{ [key: string]: boolean }>({});
  const { currentUser } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [intendedAction, setIntendedAction] = useState<{
    type: 'comment' | 'like' | 'share';
    postId?: string;
  } | null>(null);

  useEffect(() => {
    const initializePosts = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot: any) => {
          const posts = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            likes: doc.data().likes || [],
            comments: doc.data().comments || [],
            stats: {
              comments: doc.data().comments?.length || 0,
              shares: doc.data().stats?.shares || 0,
              likes: doc.data().likes?.length || 0
            }
          })) as Post[];
          setPosts(posts);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error initializing posts:', error);
      }
    };

    initializePosts();
  }, []);

  const handleAuthRequired = (action: 'comment' | 'like' | 'share', postId?: string) => {
    if (!currentUser) {
      setIntendedAction({ type: action, postId });
      setIsAuthOpen(true);
      return false;
    }
    return true;
  };

  const handleComment = async (postId: string) => {
    if (!handleAuthRequired('comment', postId)) return;
    if (!commentText.trim()) return;

    try {
      const newComment: Comment = {
        id: crypto.randomUUID(),
        uid: currentUser!.uid,
        text: commentText.trim(),
        timestamp: new Date().toISOString(),
        userDisplayName: currentUser!.displayName || 'Anonymous',
        userPhotoURL: currentUser!.photoURL || '',
        createdAt: new Date().toISOString(),
        likes: []
      };

      setCommentText('');

      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        console.error('Post not found');
        return;
      }

      const currentComments = postDoc.data().comments || [];

      await updateDoc(postRef, {
        comments: [...currentComments, newComment],
        'stats.comments': increment(1)
      });

    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!handleAuthRequired('like', postId)) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const hasLiked = post.likes?.includes(currentUser!.uid);

      await updateDoc(postRef, {
        likes: hasLiked
          ? arrayRemove(currentUser!.uid)
          : arrayUnion(currentUser!.uid)
      });
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleShare = async (post: Post) => {
    if (!handleAuthRequired('share')) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.authorName}`,
          text: post.content,
          url: window.location.href
        });

        const postRef = doc(db, 'posts', post.id);
        await updateDoc(postRef, {
          'stats.shares': increment(1)
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleCommentLike = async (postId: string, commentId: string) => {
    if (!handleAuthRequired('like')) return;

    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) {
      console.error('Post not found');
      return;
    }

    const comment = postDoc.data().comments?.find((c: Comment) => c.id === commentId);
    if (!comment) {
      console.error('Comment not found');
      return;
    }

    const hasLikedComment = comment.likes?.includes(currentUser!.uid);

    await updateDoc(postRef, {
      comments: postDoc.data().comments.map((c: Comment) => {
        if (c.id === commentId) {
          return {
            ...c,
            likes: hasLikedComment
              ? c.likes.filter((uid: string) => uid !== currentUser!.uid)
              : [...(c.likes || []), currentUser!.uid]
          };
        }
        return c;
      })
    });
  };

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const shouldShowSeeMore = (content: string) => {
    return content.length > 300;
  };

  const getTruncatedContent = (content: string, postId: string) => {
    if (!shouldShowSeeMore(content) || expandedPosts[postId]) {
      return content;
    }
    return content.slice(0, 300) + '...';
  };

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold p-4 dark:text-white">Home</h1>
      </div>

      {/* Posts */}
      <div className="mt-0 md:mt-0">
        {posts.map((post) => (
          <div key={post.id} className="p-4 space-y-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
            {/* Post Header */}
            <div className="flex items-center space-x-3">
              <img
                src={post.authorAvatar || 'https://via.placeholder.com/40'}
                alt={post.authorName}
                className="h-10 w-10 rounded-full"
              />
              <div>
                <div className="font-semibold dark:text-white">{post.authorName}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {post.timestamp?.toDate().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
              {getTruncatedContent(post.content, post.id)}
              <LinkPreview content={getTruncatedContent(post.content, post.id)} />
              {shouldShowSeeMore(post.content) && (
                <button
                  onClick={() => togglePostExpansion(post.id)}
                  className="ml-2 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center space-x-1"
                >
                  {expandedPosts[post.id] ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>See more</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Post Media */}
            {post.media && post.media.length > 0 && (
              <div className="rounded-xl overflow-hidden">
                {post.media.map((media, index) => (
                  <div key={index}>
                    {media.type === 'image' && (
                      <img
                        src={media.url}
                        alt="Post media"
                        className="w-full h-auto object-cover"
                      />
                    )}
                    {media.type === 'video' && (
                      <video
                        src={media.url}
                        controls
                        className="w-full h-auto"
                      />
                    )}
                    {media.type === 'file' && (
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{media.filename}</p>
                          <p className="text-xs text-gray-500">
                            {media.size ? (media.size / (1024 * 1024)).toFixed(2) : '0'} MB
                          </p>
                        </div>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-around pt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  if (handleAuthRequired('comment', post.id)) {
                    setActiveCommentPost(activeCommentPost === post.id ? null : post.id);
                  }
                }}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400"
              >
                <MessageCircle className="h-5 w-5" />
                <span>{post.stats?.comments || 0}</span>
              </button>
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center space-x-2 ${
                  currentUser?.uid && post.likes?.includes(currentUser.uid)
                    ? 'text-red-500'
                    : 'text-gray-500 hover:text-red-500 dark:hover:text-red-400'
                }`}
              >
                <Heart className="h-5 w-5" />
                <span>{post.likes?.length || 0}</span>
              </button>
              <button
                onClick={() => handleShare(post)}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400"
              >
                <Share className="h-5 w-5" />
                <span>{post.stats?.shares || 0}</span>
              </button>
            </div>

            {/* Comment Section */}
            {activeCommentPost === post.id && (
              <div className="mt-4 space-y-4">
                {/* Comment Input */}
                <div className="flex space-x-2">
                  <img
                    src={currentUser?.photoURL || '/default-avatar.png'}
                    alt="Your avatar"
                    className="h-8 w-8 rounded-full"
                  />
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={!commentText.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {post.comments?.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((comment) => (
                    <div key={comment.id} className="flex space-x-2">
                      <img
                        src={comment.userPhotoURL || currentUser?.photoURL || '/default-avatar.png'}
                        alt={comment.userDisplayName}
                        className="h-8 w-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + comment.userDisplayName;
                        }}
                      />
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <div className="font-semibold dark:text-white">
                          {comment.userDisplayName}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 break-words">
                          {comment.text}
                        </div>
                        <button
                          onClick={() => handleCommentLike(post.id, comment.id)}
                          className={`flex items-center space-x-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 ${
                            currentUser && comment.likes?.includes(currentUser.uid) ? 'text-blue-500' : ''
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-xs">{comment.likes?.length || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setIntendedAction(null);
        }}
        onSuccess={() => {
          setIsAuthOpen(false);
          // After successful sign in, perform the intended action
          if (intendedAction) {
            switch (intendedAction.type) {
              case 'comment':
                if (intendedAction.postId) {
                  setActiveCommentPost(intendedAction.postId);
                }
                break;
              case 'like':
                if (intendedAction.postId) {
                  handleLike(intendedAction.postId);
                }
                break;
              case 'share':
                // Share action will be handled by the user clicking the share button again
                break;
            }
          }
          setIntendedAction(null);
        }}
      />
    </div>
  );
}
