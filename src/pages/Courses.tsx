import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, getDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, ArrowRight, Play } from 'lucide-react';
import { Course } from '../components/dashboard/types';
import { useNavigate } from 'react-router-dom';

export function Courses() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'web' | 'mobile' | 'mind'>('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = coursesSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as Course[];
        setCourses(coursesData);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    const fetchEnrolledCourses = async () => {
      if (!currentUser) return;

      try {
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentId', '==', currentUser.uid)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const enrolledIds = enrollmentsSnapshot.docs.map((doc: any) => doc.data().courseId);
        setEnrolledCourses(enrolledIds);
      } catch (err) {
        console.error('Error fetching enrolled courses:', err);
      }
    };

    fetchCourses();
    fetchEnrolledCourses();
  }, [currentUser]);

  const handlePurchase = async (courseId: string) => {
    if (!currentUser) {
      setError('Please log in to purchase courses');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get course details
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (!courseDoc.exists()) throw new Error('Course not found');
      const courseData = courseDoc.data();

      // Create order
      const response = await fetch('https://asia-south1-mydatabase-10917.cloudfunctions.net/createRazorpayOrderFunction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: courseData.price,
          currency: 'INR',
          receipt: `${courseId}_${Date.now()}`,
          notes: {
            courseId,
            studentId: currentUser.uid,
            courseTitle: courseData.title
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to create order:', data);
        throw new Error(data.error || 'Failed to create order');
      }

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'FSociety',
        description: courseData.title,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('https://asia-south1-mydatabase-10917.cloudfunctions.net/verifyRazorpayPaymentFunction', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) {
              console.error('Payment verification failed:', verifyData);
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            // Add enrollment to Firestore
            await addDoc(collection(db, 'enrollments'), {
              studentId: currentUser.uid,
              courseId,
              enrolledAt: new Date(),
              paymentDetails: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id
              }
            });

            // Update UI
            setEnrolledCourses(prev => [...prev, courseId]);
            setError('');
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Failed to verify payment');
          }
        },
        prefill: {
          name: currentUser.displayName || '',
          email: currentUser.email || ''
        },
        theme: {
          color: '#2563eb'
        }
      };

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);

    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  const filteredCourses =
    selectedCategory === 'all' ? courses : courses.filter((course) => course.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-black">
      <div className="sticky top-16 md:top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Courses</h1>
            <div className="flex space-x-1">
              {(['all', 'web', 'mobile', 'mind'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-800 text-red-200 rounded-lg text-sm">{error}</div>
        )}

        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{course.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{course.description}</p>

                    <div className="space-y-1 mb-3">
                      {course.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-blue-500">₹{course.price}</span>
                        {course.originalPrice && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 line-through">₹{course.originalPrice}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                          {course.category} - {course.level}
                        </span>
                        {enrolledCourses.includes(course.id) ? (
                          <button
                            onClick={() => handleStartCourse(course.id)}
                            className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors text-sm"
                          >
                            <Play className="h-4 w-4" />
                            <span>Start</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchase(course.id)}
                            disabled={loading}
                            className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          >
                            <span>Enroll</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
