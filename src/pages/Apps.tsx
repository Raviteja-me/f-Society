// import { useAuth } from '../context/AuthContext'; // Removed as it's no longer used
// import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'; // Removed Firebase imports
// import { db } from '../firebase'; // Removed Firebase imports
import {
Star, Users, Clock, Zap, MessageSquare, ExternalLink, Feather, Download, EyeOff, Crop, Sparkles, ListChecks, Image, Lock, Paperclip, ScanText, LayoutDashboard, UserX, Eye } from 'lucide-react';

// interface AppUsage { // Removed AppUsage interface
//   id: string;
//   userId: string;
//   appId: string;
//   lastUsed: Date;
//   usageCount: number;
// }

export function Apps() {
  // const { currentUser } = useAuth(); // Removed currentUser as it's no longer used
  // const [isLoading, setIsLoading] = useState(false); // Removed isLoading state
  // const [error, setError] = useState(''); // Removed error state

  const handleLaunchApp = async (appId: string) => {
    // if (!currentUser) return; // User check might still be useful, but not strictly needed for redirect only

    let url = '';
    switch (appId) {
      case 'lazyjobseeker':
        url = 'https://lazyjobseeker.com';
        break;
      case 'angel-interview-copiler':
        url = 'https://lazyjobseeker.com/angel-live';
        break;
      case 'bg-remover':
        url = 'https://bg-remover.lazyjobseeker.com/';
        break;
      case 'lazy-url':
        url = 'https://lazy-url.lazyjobseeker.com/';
        break;
      case 'lazy-template':
        url = 'https://lazytemplate.lazyjobseeker.com/';
        break;
      default:
        console.error('Unknown appId:', appId);
        return;
    }

    try {
      // setIsLoading(true); // Removed setIsLoading
      // setError(''); // Removed setError

      // // Record app usage // Removed Firebase call
      // await addDoc(collection(db, 'app_usage'), {
      //   userId: currentUser.uid,
      //   appId,
      //   lastUsed: new Date(),
      //   usageCount: 1
      // });

      // Open app in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error launching app:', err);
      // setError('Failed to launch application'); // Removed setError
    } finally {
      // setIsLoading(false); // Removed setIsLoading
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold p-4 text-gray-900 dark:text-white">Apps</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* LazyJobSeeker App Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              {/* Image Section (removed) */}

              {/* Content Section */}
              <div className="p-6 flex-1 flex flex-col">
                {/* App Name */}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">LazyJobSeeker.com</h2>

                {/* Rating and User Count */}
                <div className="flex items-center space-x-4 mb-5">
                  {/* Rating */}
                  <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1 rounded-full text-xs font-medium text-yellow-800 dark:text-yellow-200">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                    <span>4.9 Rating</span>
                  </div>
                  {/* User Count */}
                  <div className="text-gray-600 dark:text-gray-400 font-medium text-xs">
                    10K+ Users
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  Create professional resumes in 60 seconds with AI-powered templates, ATS optimization, and smart job suggestions.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {/* Feature: Category */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                      <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Category</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Resume Builder</div>
                    </div>
                  </div>
                  {/* Feature: Time to Create */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <Clock className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Time to Create</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Under 60s</div>
                    </div>
                  </div>
                  {/* Feature: Technology */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                      <Zap className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Technology</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">AI Powered</div>
                    </div>
                  </div>
                  {/* Feature: Support Type */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Support Type</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Interview Prep</div>
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLaunchApp('lazyjobseeker')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-5 py-2.5 rounded-md hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                  >
                    <span>Launch App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Angel Interview Copiler App Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              {/* Content Section */}
              <div className="p-6 flex-1 flex flex-col">
                {/* App Name */}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Angel Interview Copiler</h2>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  It is invisible assitent tained for interviews and meeting which helps in live intrview by providing answer on screen.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {/* Feature: Type */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                      <Feather className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Type</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Lightweight</div>
                    </div>
                  </div>
                  {/* Feature: Availability */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <Download className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Availability</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Installable</div>
                    </div>
                  </div>
                  {/* Feature: Privacy */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                      <EyeOff className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Privacy</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Hidden from Screen Sharing</div>
                    </div>
                  </div>
                  {/* Feature: Responsiveness */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                      <Zap className="h-4 w-4 text-purple-500" /> {/* Using Zap for Fast/Real-time */}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Responsiveness</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Fast & Real-time</div>
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLaunchApp('angel-interview-copiler')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-5 py-2.5 rounded-md hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                  >
                    <span>Launch App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Background Remover App Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              {/* Content Section */}
              <div className="p-6 flex-1 flex flex-col">
                {/* App Name */}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Background Remover</h2>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  High quality background removal tool that preserves small details. Remove backgrounds from images with perfect precision.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {/* Feature: Precision */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                      <Crop className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Precision</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">High precision edge detection</div>
                    </div>
                  </div>
                  {/* Feature: Detail Preservation */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <Sparkles className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Details</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Preserves fine details</div>
                    </div>
                  </div>
                  {/* Feature: Processing */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                      <ListChecks className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Processing</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Batch processing</div>
                    </div>
                  </div>
                  {/* Feature: Quality */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                      <Image className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Quality</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">No quality loss</div>
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLaunchApp('bg-remover')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-5 py-2.5 rounded-md hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                  >
                    <span>Launch App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lazy URL App Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              {/* Content Section */}
              <div className="p-6 flex-1 flex flex-col">
                {/* App Name */}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Lazy URL</h2>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  Convert anything to a shareable URL. Images, PDFs, audio files - all stored locally for maximum privacy.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {/* Feature: Storage */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                      <Lock className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Storage</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Local storage for privacy</div>
                    </div>
                  </div>
                  {/* Feature: Links */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <Clock className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Links</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Temporary links</div>
                    </div>
                  </div>
                  {/* Feature: Account */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                      <UserX className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Account</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">No account needed</div>
                    </div>
                  </div>
                  {/* Feature: File Support */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                      <Paperclip className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">File Support</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Support for all file types</div>
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLaunchApp('lazy-url')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-5 py-2.5 rounded-md hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                  >
                    <span>Launch App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lazy Templates App Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              {/* Content Section */}
              <div className="p-6 flex-1 flex flex-col">
                {/* App Name */}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Lazy Templates</h2>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  Free resume templates with auto-parsing, live editing, and PDF download. Create professional resumes in minutes.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {/* Feature: Parsing */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                      <ScanText className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Parsing</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Auto-parsing from existing resumes</div>
                    </div>
                  </div>
                  {/* Feature: Editing */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <Eye className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Editing</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Live preview</div>
                    </div>
                  </div>
                  {/* Feature: Templates */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                      <LayoutDashboard className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Templates</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Multiple templates</div>
                    </div>
                  </div>
                  {/* Feature: Download */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                      <Download className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Download</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Direct PDF download</div>
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLaunchApp('lazy-template')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-5 py-2.5 rounded-md hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                  >
                    <span>Launch App</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* NutriSnap App Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">NutriSnap</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  Get your personal diet plan, track meals with just an image, check if you reached your daily goals, and get a fully tailored weekly plan. All free, powered by AI. Like HealthifyMe, but open source and free forever.
                </p>
                <ul className="mb-6 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                  <li>Personalized diet plans</li>
                  <li>Track meals with a photo</li>
                  <li>Daily & weekly goal tracking</li>
                  <li>Fully tailored to your profile</li>
                  <li>Free and open source</li>
                  <li>Powerful AI, just like HealthifyMe</li>
                </ul>
                <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLaunchApp('nutrisnap')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-5 py-2.5 rounded-md hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                  >
                    <span>Try NutriSnap</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cluely Cone App Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Cluely Cone</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  A stealth interview hacker: always on top, fully transparent, and helps you during interviews. Just like Cluely, but 100% free and open source.
                </p>
                <ul className="mb-6 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                  <li>Stealth mode: hides during interviews</li>
                  <li>Always on top & transparent</li>
                  <li>Real-time interview help</li>
                  <li>Free forever</li>
                  <li>Open source</li>
                  <li>Download for Windows, Mac, and more</li>
                </ul>
                <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLaunchApp('cluely-cone')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-5 py-2.5 rounded-md hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                  >
                    <span>Try Cluely Cone</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pushpaka Rides App Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Pushpaka Rides</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  A perfect clone of Uber, Rapido, Ola-type apps. All algorithms included, minimal API usage, runs at very low cost. Try it on pushpakarides.com. Available for Windows, iOS, Android, and Web. Open source!
                </p>
                <ul className="mb-6 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                  <li>Clone of Uber, Rapido, Ola</li>
                  <li>All algorithms included</li>
                  <li>Minimal API usage</li>
                  <li>Runs at very low cost</li>
                  <li>Available for Windows, iOS, Android, Web</li>
                  <li>Open source</li>
                </ul>
                <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLaunchApp('pushpaka-rides')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-5 py-2.5 rounded-md hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                  >
                    <span>Try Pushpaka Rides</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Anything to PDF App Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Anything to PDF</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  Convert any file format to PDF. Documents, images, webpages - transform them all with a single click.
                </p>
                <ul className="mb-6 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                  <li>Multiple format support</li>
                  <li>Maintains formatting</li>
                  <li>Batch conversion</li>
                  <li>High-quality output</li>
                </ul>
                <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLaunchApp('anything-to-pdf')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-5 py-2.5 rounded-md hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                  >
                    <span>Try Anything to PDF</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Imagenius AI Image Editor App Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Imagenius AI Image Editor</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  Just edit images with chatting. AI-powered image editing made simple and interactive.
                </p>
                <ul className="mb-6 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                  <li>Edit images via chat</li>
                  <li>AI-powered enhancements</li>
                  <li>Easy to use</li>
                  <li>No design skills needed</li>
                </ul>
                <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLaunchApp('imagenius-ai-image-editor')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-green-500 text-white px-5 py-2.5 rounded-md hover:from-blue-600 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                  >
                    <span>Try Imagenius AI Image Editor</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Landing AI App Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col md:flex-row">
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Landing AI</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  Just create a landing page with a prompt and download code to add to your existing project. Edit and modify the page as you like.
                </p>
                <ul className="mb-6 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                  <li>Prompt-based landing page creation</li>
                  <li>Downloadable code</li>
                  <li>Easy integration</li>
                  <li>Fully editable</li>
                </ul>
                <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLaunchApp('landing-ai')}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-5 py-2.5 rounded-md hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                  >
                    <span>Try Landing AI</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error display (removed) */}
      </div>
    </div>
  );
} 