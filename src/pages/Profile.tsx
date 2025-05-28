import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase.ts';
import { Camera, Save } from 'lucide-react';

export function Profile() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [photoURL, setPhotoURL] = useState('');
  const [bio, setBio] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setPhotoURL(userData.photoURL || '');
            setBio(userData.bio || '');
            setName(userData.name || '');
            setEmail(userData.email || '');
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
        setPhotoURL(downloadURL);
        
        // Update Firestore
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
          bio,
          name,
          email
        });
        setIsEditing(false);
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to update profile');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <img
              src={photoURL || 'https://via.placeholder.com/150'}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover"
            />
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer hover:bg-blue-600 transition"
            >
              <Camera className="h-5 w-5 text-white" />
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          {isEditing ? (
            <div className="w-full space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write something about yourself..."
                className="w-full p-2 border rounded-lg h-32 dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                onClick={handleSave}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>Save Changes</span>
              </button>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <h2 className="text-2xl font-bold text-center">{name}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-center">{email}</p>
              <p className="text-gray-600 dark:text-gray-300 text-center">{bio}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Edit Profile
              </button>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
} 