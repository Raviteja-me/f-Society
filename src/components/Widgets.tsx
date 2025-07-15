import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function Widgets() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        setIsAdmin(userDoc.data()?.isAdmin === true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  const suggestions = [
    { 
      name: 'Ravi teja Beere', 
      handle: '@linkedin', 
      avatar: '/admin.png', // Use provided admin profile image
      isAdmin: true,
      redirectUrl: 'https://www.linkedin.com/in/raviteja-beere-89a420167/'
    },
    {
      name: 'Instagram',
      handle: '@lazyjobseeker.com_official',
      avatar: '/insta.png', // Use Instagram logo
      isAdmin: false,
      redirectUrl: 'https://www.instagram.com/lazyjobseeker.com_official/'
    },
    {
      name: 'YouTube',
      handle: '@LazyJobSeeker',
      avatar: '/youtube.png', // Use YouTube logo
      isAdmin: false,
      redirectUrl: 'https://www.youtube.com/@LazyJobSeeker'
    },
    {
      name: 'LinkedIn',
      handle: '@LazyJobSeeker',
      avatar: '/linkedin.png', // Use LinkedIn logo
      isAdmin: false,
      redirectUrl: 'https://www.linkedin.com/company/106751084/admin/dashboard/'
    },
    {
      name: 'YouTube',
      handle: '@SunShine-Raviteja',
      avatar: '/youtube.png', // Use YouTube logo
      isAdmin: false,
      redirectUrl: 'https://www.youtube.com/@SunShine-Raviteja'
    },
  ];

  const handleRedirect = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="w-80 p-4 space-y-4">
      <div className="sticky top-0 pt-2 bg-white dark:bg-black">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 dark:text-white transition-colors"
          />
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold dark:text-white">Who to follow</h2>
          {isAdmin && (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition"
            >
              Dashboard
            </button>
          )}
        </div>
        <div className="space-y-4">
          {suggestions.map((suggestion, idx) => (
            <div 
              key={suggestion.handle + idx} 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => handleRedirect(suggestion.redirectUrl)}
            >
              <div className="flex items-center space-x-3">
                <img src={suggestion.avatar} alt={suggestion.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <div className="flex items-center space-x-1">
                    <p className="font-bold dark:text-white">{suggestion.name}</p>
                    {suggestion.isAdmin && (
                      <span className="text-xs bg-blue-900 text-white px-2 py-0.5 rounded-full ml-1">ADMIN</span>
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">{suggestion.handle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}