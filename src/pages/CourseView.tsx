import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Course, CourseMaterial } from '../components/dashboard/types';
import { FileText, Link as LinkIcon, ChevronRight, ChevronLeft, Video, File, BookOpen, ExternalLink } from 'lucide-react';

export function CourseView() {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [course, setCourse] = useState<Course | null>(null);
  const [currentClassIndex, setCurrentClassIndex] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;

      try {
        if (!currentUser) {
          setError('Please log in to view course content');
          setLoading(false);
          return;
        }

        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (!courseDoc.exists()) {
          setError('Course not found');
          setLoading(false);
          return;
        }

        const courseData = courseDoc.data() as Course;
        setCourse(courseData);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course content');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, currentUser]);

  const handleNextClass = () => {
    if (course && currentClassIndex < course.classes.length - 1) {
      setCurrentClassIndex(prev => prev + 1);
    }
  };

  const handlePreviousClass = () => {
    if (currentClassIndex > 0) {
      setCurrentClassIndex(prev => prev - 1);
    }
  };

  const getGoogleDriveEmbedUrl = (url: string) => {
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/file/d/')[1].split('/')[0];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (url.includes('drive.google.com/open?id=')) {
      const fileId = url.split('id=')[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  const renderMaterial = (material: CourseMaterial) => {
    switch (material.type) {
      case 'video':
        const videoUrl = material.url.includes('drive.google.com') 
          ? getGoogleDriveEmbedUrl(material.url)
          : material.url;
        
        return (
          <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl">
            {material.url.includes('drive.google.com') ? (
              <iframe
                src={videoUrl}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{ border: 'none' }}
              />
            ) : (
              <video
                src={videoUrl}
                controls
                className="w-full h-full"
                controlsList="nodownload"
                playsInline
                preload="metadata"
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="relative group">
            <img
              src={material.url}
              alt={material.title}
              className="w-full rounded-xl shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl"
            />
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70"
            >
              <ExternalLink className="h-5 w-5 text-white" />
            </a>
          </div>
        );
      case 'pdf':
        const pdfUrl = material.url.includes('drive.google.com')
          ? getGoogleDriveEmbedUrl(material.url)
          : material.url;
        return (
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800/70 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-orange-500" />
              <span className="text-white">{material.title}</span>
            </div>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>View PDF</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800/70 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <LinkIcon className="h-6 w-6 text-green-500" />
              <span className="text-white">{material.title}</span>
            </div>
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Open Link</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="p-3 bg-red-900/50 border border-red-800 text-red-200 rounded-lg text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const currentClass = course.classes[currentClassIndex];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-16 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold p-4 text-gray-900 dark:text-white">Course</h1>
      </div>

      <div className="flex-1 flex flex-col p-4">
        <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2 min-w-0">
                <BookOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <h1 className="text-base font-medium text-gray-900 dark:text-white">
                  {course.title.length > 30 ? `${course.title.substring(0, 30)}...` : course.title}
                </h1>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentClassIndex + 1}/{course.classes.length}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handlePreviousClass}
                    disabled={currentClassIndex === 0}
                    className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleNextClass}
                    disabled={currentClassIndex === course.classes.length - 1}
                    className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-3 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-4">
              {/* Main Video */}
              {currentClass.materials.find(m => m.type === 'video') && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
                  <h3 className="text-base font-medium mb-3 text-gray-900 dark:text-white flex items-center space-x-2">
                    <Video className="h-4 w-4 text-red-500" />
                    <span>Main Video</span>
                  </h3>
                  {renderMaterial(currentClass.materials.find(m => m.type === 'video')!)}
                </div>
              )}

              {/* Class Title and Description */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{currentClass.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{currentClass.description}</p>
              </div>

              {/* Instructions */}
              {currentClass.instructions && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
                  <h3 className="text-base font-medium mb-3 text-gray-900 dark:text-white flex items-center space-x-2">
                    <File className="h-4 w-4 text-blue-500" />
                    <span>Instructions</span>
                  </h3>
                  <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
                    {currentClass.instructions}
                  </div>
                </div>
              )}

              {/* Additional Materials */}
              {currentClass.materials.filter(m => m.type !== 'video').length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
                  <h3 className="text-base font-medium mb-3 text-gray-900 dark:text-white">Additional Materials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentClass.materials
                      .filter(m => m.type !== 'video')
                      .map((material, index) => (
                        <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-2.5 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 hover:shadow-lg">
                          {renderMaterial(material)}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              {/* Course Progress */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
                <h3 className="text-base font-medium mb-3 text-gray-900 dark:text-white">Course Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Progress</span>
                    <span className="text-gray-900 dark:text-white">
                      {Math.round(((currentClassIndex + 1) / course.classes.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${((currentClassIndex + 1) / course.classes.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Course Navigation */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
                <h3 className="text-base font-medium mb-3 text-gray-900 dark:text-white">Course Navigation</h3>
                <div className="space-y-1.5">
                  {course.classes.map((courseClass, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentClassIndex(index)}
                      className={`w-full text-left p-2 rounded-md transition-all duration-300 ${
                        index === currentClassIndex
                          ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                          index === currentClassIndex
                            ? 'bg-blue-500 text-white scale-110'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="truncate text-sm">{courseClass.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 