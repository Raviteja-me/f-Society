import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Course } from '../components/dashboard/types';
import { Play, CheckCircle } from 'lucide-react';

interface EnrolledCourse extends Course {
  enrolledAt: Date;
  progress: number;
}

export function MyCourses() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!currentUser) {
        setError('Please log in to view your courses');
        setLoading(false);
        return;
      }

      try {
        // Fetch enrolled courses from the database
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentId', '==', currentUser.uid)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        
        const enrolledCoursesData: EnrolledCourse[] = [];
        
        for (const enrollment of enrollmentsSnapshot.docs) {
          const courseDoc = await getDocs(query(
            collection(db, 'courses'),
            where('id', '==', enrollment.data().courseId)
          ));
          
          if (!courseDoc.empty) {
            const courseData = courseDoc.docs[0].data() as Course;
            enrolledCoursesData.push({
              ...courseData,
              enrolledAt: enrollment.data().enrolledAt.toDate(),
              progress: enrollment.data().progress || 0
            });
          }
        }

        setEnrolledCourses(enrolledCoursesData);
      } catch (err) {
        console.error('Error fetching enrolled courses:', err);
        setError('Failed to load your courses');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [currentUser]);

  const handleStartCourse = (courseId: string) => {
    // TODO: Implement course content viewing
    console.log('Starting course:', courseId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <h1 className="text-xl font-bold dark:text-white">My Courses</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {enrolledCourses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">You haven't enrolled in any courses yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrolledCourses.map(course => (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1 dark:text-white">{course.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{course.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                            {course.category} - {course.level}
                          </span>
                          <span className="text-sm text-gray-500">
                            Enrolled on {course.enrolledAt.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {course.progress}% Complete
                            </span>
                          </div>
                          <button
                            onClick={() => handleStartCourse(course.id)}
                            className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          >
                            <Play className="h-4 w-4" />
                            <span>Continue</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 