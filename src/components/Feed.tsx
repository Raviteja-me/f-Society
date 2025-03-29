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
  increment 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MessageCircle, Repeat2, Heart, Share, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Feed() {
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        likes: doc.data().likes || [],
        comments: doc.data().comments || []
      }));
      setPosts(posts);
    });

    return () => unsubscribe();
  }, []);

  const handleLike = async (postId) => {
    if (!currentUser) return;
    
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    const hasLiked = post.likes.includes(currentUser.uid);

    await updateDoc(postRef, {
      likes: hasLiked 
        ? arrayRemove(currentUser.uid)
        : arrayUnion(currentUser.uid)
    });
  };

  const handleComment = async (postId) => {
    if (!currentUser || !commentText.trim()) return;

    const postRef = doc(db, 'posts', postId);
    const comment = {
      uid: currentUser.uid,
      text: commentText.trim(),
      timestamp: serverTimestamp(),
      userDisplayName: currentUser.displayName || 'Anonymous',
      userPhotoURL: currentUser.photoURL || '',
      createdAt: new Date().toISOString()
    };

    try {
      await updateDoc(postRef, {
        comments: arrayUnion(comment),
        'stats.comments': increment(1)  // Increment comment count
      });

      setCommentText('');
      setActiveCommentPost(null);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = async (post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post on Y-Society',
          text: post.content,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="border-l border-r border-gray-200 dark:border-gray-800">
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {posts.map((post: any) => (
          <div key={post.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex space-x-3">
              <img 
                src={post.authorAvatar} 
                alt={post.authorName}
                className="h-12 w-12 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold dark:text-white">{post.authorName}</span>
                  <span className="text-gray-500 dark:text-gray-400">·</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(post.timestamp?.toDate()).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="mt-2 text-gray-900 dark:text-white">{post.content}</p>
                
                {post.media && post.media.length > 0 && (
                  <div className="mt-3 grid gap-2">
                    {post.media.map((media, index) => (
                      <div key={index}>
                        {media.type === 'image' ? (
                          <img src={media.url} alt="" className="rounded-2xl" />
                        ) : media.type === 'video' ? (
                          <video src={media.url} controls className="rounded-2xl" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex justify-between">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 ${
                      post.likes.includes(currentUser?.uid) 
                        ? 'text-red-500' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Heart className="h-5 w-5" />
                    <span>{post.likes.length}</span>
                  </button>

                  <button 
                    onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{post.comments.length}</span>
                  </button>

                  <button 
                    onClick={() => handleShare(post)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400"
                  >
                    <Share className="h-5 w-5" />
                  </button>
                </div>

                {activeCommentPost === post.id && (
                  <div className="mt-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 rounded-full px-4 py-2 bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="mt-4 space-y-4">
                      {post.comments.map((comment, index) => (
                        <div key={index} className="flex space-x-2">
                          <img
                            src={comment.userPhotoURL}
                            alt={comment.userDisplayName}
                            className="h-8 w-8 rounded-full"
                          />
                          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                            <div className="font-semibold dark:text-white">
                              {comment.userDisplayName}
                            </div>
                            <div className="text-gray-700 dark:text-gray-300">
                              {comment.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}