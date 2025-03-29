import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  increment,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MessageCircle, Repeat2, Heart, Share, Send, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FileText, FileImage, FileVideo, FileArchive, FileSpreadsheet } from 'lucide-react';

export function Feed() {
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const initializePosts = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('timestamp', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            likes: doc.data().likes || [],
            comments: doc.data().comments || [],
            stats: {
              comments: doc.data().comments?.length || 0,
              shares: doc.data().stats?.shares || 0,
              likes: doc.data().likes?.length || 0
            }
          }));
          setPosts(posts);
        });
  
        return () => unsubscribe();
      } catch (error) {
        console.error('Error initializing posts:', error);
      }
    };
  
    initializePosts();
  }, []);

  const handleComment = async (postId) => {
    if (!currentUser || !commentText.trim()) return;

    try {
      // Optimistically update UI first
      const newComment = {
        id: crypto.randomUUID(),
        uid: currentUser.uid,
        text: commentText.trim(),
        timestamp: new Date().toISOString(),
        userDisplayName: currentUser.displayName || 'Anonymous',
        userPhotoURL: currentUser.photoURL || '',
        createdAt: new Date().toISOString(),
        likes: []
      };

      // Clear input immediately but keep comment section open
      setCommentText('');

      // Update Firestore
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

      // Don't close comment section after posting
      // setActiveCommentPost(null); - removed this line

    } catch (error) {
      console.error('Error adding comment:', error);
      // Optionally show error message to user
    }
};

// Add loading state for comment posting
const [isPostingComment, setIsPostingComment] = useState(false);

// Update the form submission
<form
  onSubmit={async (e) => {
    e.preventDefault();
    if (isPostingComment) return; // Prevent double submission
    setIsPostingComment(true);
    await handleComment(post.id);
    setIsPostingComment(false);
  }}
  className="flex space-x-2"
>
  <input
    type="text"
    value={commentText}
    onChange={(e) => setCommentText(e.target.value)}
    placeholder="Write a comment..."
    className="flex-1 rounded-full px-4 py-2 bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  <button
    type="submit"
    disabled={!commentText.trim() || isPostingComment}
    className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isPostingComment ? 'Posting...' : 'Post'}
  </button>
</form>


  // Update handleLike function
  const handleLike = async (postId) => {
    if (!currentUser) return;
  
    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      const hasLiked = post.likes?.includes(currentUser.uid);
  
      await updateDoc(postRef, {
        likes: hasLiked 
          ? arrayRemove(currentUser.uid)
          : arrayUnion(currentUser.uid)
      });
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleShare = async (post) => {
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

  const handleCommentLike = async (postId, commentId) => {
    if (!currentUser) return;

    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) {
      console.error('Post not found');
      return;
    }

    const comment = postDoc.data().comments?.find(c => c.id === commentId);
    if (!comment) {
      console.error('Comment not found');
      return;
    }

    const hasLikedComment = comment.likes?.includes(currentUser.uid);

    await updateDoc(postRef, {
      comments: postDoc.data().comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            likes: hasLikedComment
              ? c.likes.filter((uid) => uid !== currentUser.uid)
              : [...(c.likes || []), currentUser.uid]
          };
        }
        return c;
      })
    });
  };


  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {posts.map((post) => (
        <div key={post.id} className="p-4 space-y-4">
          {/* Post Header */}
          <div className="flex items-center space-x-3">
            <img
              src={post.authorAvatar || 'https://via.placeholder.com/40'}
              alt={post.authorName}
              className="h-10 w-10 rounded-full"
            />
            <div>
              <div className="font-semibold dark:text-white">{post.authorName}</div>
              <div className="text-sm text-gray-500">
                {post.timestamp?.toDate().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Post Media */}
          {post.media && post.media.length > 0 && (
            <div className="mt-3 space-y-3">
              {post.media.map((media, index) => (
                <div key={index}>
                  {media.type === 'image' && (
                    <img
                      src={media.url}
                      alt=""
                      className="w-full max-h-[512px] object-contain rounded-2xl"
                    />
                  )}
                  {media.type === 'video' && (
                    <video
                      src={media.url}
                      controls
                      className="w-full max-h-[512px] rounded-2xl"
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
                          {(media.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Post Stats */}
          <div className="flex items-center justify-around pt-2 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.stats?.comments || 0}</span>
            </button>
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center space-x-2 ${
                post.likes?.includes(currentUser?.uid) 
                  ? 'text-red-500' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className="h-5 w-5" />
              <span>{post.likes?.length || 0}</span>
            </button>
            <button 
              onClick={() => handleShare(post)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
            >
              <Share className="h-5 w-5" />
              <span>{post.stats?.shares || 0}</span>
            </button>
          </div>

          {/* Comment section */}
          {activeCommentPost === post.id && (
            <div className="mt-4 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleComment(post.id);
                }}
                className="flex space-x-2"
              >
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-full px-4 py-2 bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </form>

              {/* Display comments */}
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
                      <div className="text-gray-700 dark:text-gray-300">
                        {comment.text}
                      </div>
                      <button
                        onClick={() => handleCommentLike(post.id, comment.id)}
                        className={`flex items-center space-x-2 text-gray-500 hover:text-blue-500 ${comment.likes?.includes(currentUser?.uid) ? 'text-blue-500' : ''}`}
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
  );
}
