import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Course, CourseMaterial } from '../components/dashboard/types';
import { FileText, Link as LinkIcon, ChevronRight, ChevronLeft } from 'lucide-react';

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
        // Check if user is enrolled
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
    // Handle different Google Drive URL formats
    if (url.includes('drive.google.com/file/d/')) {
      // Format: https://drive.google.com/file/d/FILE_ID/view
      const fileId = url.split('/file/d/')[1].split('/')[0];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (url.includes('drive.google.com/open?id=')) {
      // Format: https://drive.google.com/open?id=FILE_ID
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
          <div className="aspect-video w-full">
            <iframe
              src={videoUrl}
              className="w-full h-full rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );
      case 'image':
        return (
          <img
            src={material.url}
            alt={material.title}
            className="w-full rounded-lg"
          />
        );
      case 'pdf':
        const pdfUrl = material.url.includes('drive.google.com')
          ? getGoogleDriveEmbedUrl(material.url)
          : material.url;
        return (
          <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <FileText className="h-6 w-6 text-blue-500" />
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              {material.title}
            </a>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <LinkIcon className="h-6 w-6 text-blue-500" />
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              {material.title}
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
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
    <div className="flex-1 flex flex-col">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <h1 className="text-xl font-bold dark:text-white">{course.title}</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Class {currentClassIndex + 1} of {course.classes.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Class Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePreviousClass}
              disabled={currentClassIndex === 0}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Previous Class</span>
            </button>
            <button
              onClick={handleNextClass}
              disabled={currentClassIndex === course.classes.length - 1}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next Class</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Current Class Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-4 dark:text-white">{currentClass.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{currentClass.description}</p>

              {/* Main Video */}
              {currentClass.materials.find(m => m.type === 'video') && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 dark:text-white">Main Video</h3>
                  {renderMaterial(currentClass.materials.find(m => m.type === 'video')!)}
                </div>
              )}

              {/* Instructions */}
              {currentClass.instructions && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 dark:text-white">Instructions</h3>
                  <div className="prose dark:prose-invert max-w-none">
                    {currentClass.instructions}
                  </div>
                </div>
              )}

              {/* Additional Materials */}
              {currentClass.materials.filter(m => m.type !== 'video').length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3 dark:text-white">Additional Materials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentClass.materials
                      .filter(m => m.type !== 'video')
                      .map((material, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          {renderMaterial(material)}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 