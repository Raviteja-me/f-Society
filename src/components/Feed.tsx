import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MessageCircle, Repeat2, Heart, Share } from 'lucide-react';

export function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(posts);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="border-l border-r border-gray-200 dark:border-gray-800">
      {/* Posts Feed */}
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
                  <div className="mt-3">
                    {post.media.map((media: any, index: number) => (
                      <div key={index}>
                        {media.type === 'image' ? (
                          <img 
                            src={media.url} 
                            alt=""
                            className="mt-3 rounded-2xl w-full h-auto object-contain"
                          />
                        ) : media.type === 'video' ? (
                          <video 
                            src={media.url} 
                            controls
                            className="mt-3 rounded-2xl w-full"
                          />
                        ) : (
                          <a 
                            href={media.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <span className="text-blue-500">📎 {media.filename}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex justify-between text-gray-500 dark:text-gray-400">
                  <button className="flex items-center space-x-2 hover:text-blue-500">
                    <MessageCircle className="h-5 w-5" />
                    <span>{post.stats?.comments || 0}</span>
                  </button>
                  <button className="flex items-center space-x-2 hover:text-green-500">
                    <Repeat2 className="h-5 w-5" />
                    <span>{post.stats?.shares || 0}</span>
                  </button>
                  <button className="flex items-center space-x-2 hover:text-red-500">
                    <Heart className="h-5 w-5" />
                    <span>{post.stats?.likes || 0}</span>
                  </button>
                  <button className="flex items-center space-x-2 hover:text-blue-500">
                    <Share className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}