import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase.ts';
import { Camera, Save, MapPin, Briefcase, Link, Calendar } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  photoURL: string;
  bio: string;
  location: string;
  company: string;
  website: string;
  joinDate: string;
  twitterHandle: string;
  interests: string[];
}

export function Profile() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    photoURL: '',
    bio: '',
    location: '',
    company: '',
    website: '',
    joinDate: '',
    twitterHandle: '',
    interests: []
  });
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfile({
              name: userData.name || '',
              email: userData.email || '',
              photoURL: userData.photoURL || '',
              bio: userData.bio || '',
              location: userData.location || '',
              company: userData.company || '',
              website: userData.website || '',
              joinDate: userData.joinDate || new Date().toISOString(),
              twitterHandle: userData.twitterHandle || '',
              interests: userData.interests || []
            });
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load profile data');
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [currentUser]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      try {
        const storageRef = ref(storage, `profile_photos/${currentUser.uid}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setProfile(prev => ({ ...prev, photoURL: downloadURL }));
        
        await updateDoc(doc(db, 'users', currentUser.uid), {
          photoURL: downloadURL
        });
      } catch (err) {
        console.error('Error uploading photo:', err);
        setError('Failed to upload photo');
      }
    }
  };

  const handleSave = async () => {
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          name: profile.name,
          bio: profile.bio,
          location: profile.location,
          company: profile.company,
          website: profile.website,
          twitterHandle: profile.twitterHandle,
          interests: profile.interests
        });
        setIsEditing(false);
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to update profile');
      }
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !profile.interests.includes(newInterest.trim())) {
      setProfile(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 bg-transparent">
      <div className="sticky top-16 md:top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold p-4 text-gray-900 dark:text-white">Profile</h1>
      </div>
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 shadow-xl overflow-hidden">
          {/* Profile Header with Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 relative flex items-center justify-center">
            {/* FSociety Logo as Main Cover */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src="/white.svg"
                alt="FSociety"
                className="h-20 w-auto opacity-90 hover:opacity-100 transition-opacity"
                onError={(e) => {
                  e.currentTarget.src = '/black.svg';
                }}
              />
            </div>
            <div className="absolute -bottom-12 left-6">
              <div className="relative">
                <img
                  src={profile.photoURL || 'https://via.placeholder.com/150'}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-gray-900/30 object-cover shadow-lg"
                />
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 bg-blue-500 p-1.5 rounded-full cursor-pointer hover:bg-blue-600 transition shadow-lg"
                >
                  <Camera className="h-4 w-4 text-white" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-14 px-6 pb-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full p-2 border border-gray-700/50 rounded-lg bg-gray-800/30 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full p-2 border border-gray-700/50 rounded-lg bg-gray-800/30 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className="w-full p-2 border border-gray-700/50 rounded-lg bg-gray-800/30 text-white placeholder-gray-500 h-20 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Add location"
                        className="w-full pl-9 p-2 border border-gray-700/50 rounded-lg bg-gray-800/30 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Company</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={profile.company}
                        onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Add company"
                        className="w-full pl-9 p-2 border border-gray-700/50 rounded-lg bg-gray-800/30 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Website</label>
                    <div className="relative">
                      <Link className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="url"
                        value={profile.website}
                        onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="Add website"
                        className="w-full pl-9 p-2 border border-gray-700/50 rounded-lg bg-gray-800/30 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Twitter</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400">@</span>
                      <input
                        type="text"
                        value={profile.twitterHandle}
                        onChange={(e) => setProfile(prev => ({ ...prev, twitterHandle: e.target.value }))}
                        placeholder="username"
                        className="w-full pl-8 p-2 border border-gray-700/50 rounded-lg bg-gray-800/30 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">Interests</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add an interest"
                      className="flex-1 p-2 border border-gray-700/50 rounded-lg bg-gray-800/30 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddInterest}
                      disabled={!newInterest.trim()}
                      className="px-4 py-2 bg-blue-500/80 text-white rounded-lg hover:bg-blue-600/80 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.interests.map((interest, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-1 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50"
                      >
                        <span className="text-sm text-gray-300">{interest}</span>
                        <button
                          onClick={() => handleRemoveInterest(interest)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4 pt-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-blue-500/80 text-white py-2 rounded-lg hover:bg-blue-600/80 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                    <p className="text-sm text-gray-400">{profile.email}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-1.5 bg-blue-500/80 text-white text-sm rounded-full hover:bg-blue-600/80 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>

                <p className="text-gray-300 text-sm">{profile.bio}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {profile.location && (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.company && (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Briefcase className="h-4 w-4" />
                      <span>{profile.company}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Link className="h-4 w-4" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        {profile.website}
                      </a>
                    </div>
                  )}
                  {profile.twitterHandle && (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <span className="text-blue-400">@</span>
                      <a href={`https://twitter.com/${profile.twitterHandle}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        {profile.twitterHandle}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(profile.joinDate).toLocaleDateString()}</span>
                </div>

                {profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-gray-800/50 px-3 py-1 rounded-full text-sm text-gray-300 border border-gray-700/50"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-800/50 text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 