import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

      // Create shorter IDs
      const shortPlanId = courseId.slice(0, 8);
      const shortStudentId = currentUser.uid.slice(0, 8);

      const requestBody = {
        amount: courseData.price * 100,
        currency: 'INR',
        planId: shortPlanId,
        planName: courseData.title,
        studentId: shortStudentId
      };

      // Log the request body
      console.log('Request Body:', requestBody);

      // Generate payment link
      const response = await fetch(import.meta.env.VITE_PAYMENT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_FSOCIETY_TOKEN}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('Payment response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate payment link');
      }

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY,
          amount: data.amount,
          currency: data.currency,
          name: 'FSociety',
          description: courseData.title,
          order_id: data.orderId,
          handler: function (response: any) {
            console.log('Payment successful:', response);
            // Handle successful payment
            verifyPayment(response.razorpay_payment_id, courseId);
          },
          prefill: {
            name: currentUser.displayName || '',
            email: currentUser.email || '',
          },
          notes: {
            planId: courseId,
            studentId: currentUser.uid
          },
          theme: {
            color: '#2563eb'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        throw new Error('Failed to load Razorpay script');
      };

    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (orderId: string, courseId: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('https://us-central1-lazy-job-seeker-4b29b.cloudfunctions.net/verifyPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          courseId,
          studentId: currentUser?.uid
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Update payment status in Firestore
        const paymentQuery = query(
          collection(db, 'payments'),
          where('orderId', '==', orderId)
        );
        const paymentSnapshot = await getDocs(paymentQuery);
        
        if (!paymentSnapshot.empty) {
          const paymentDoc = paymentSnapshot.docs[0];
          await setDoc(paymentDoc.ref, {
            status: 'success',
            verifiedAt: serverTimestamp()
          }, { merge: true });
        }

        // Add course to enrolled courses
        setEnrolledCourses(prev => [...prev, courseId]);
        setError('');
      } else {
        setError('Payment verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to check for pending payments
  useEffect(() => {
    const checkPendingPayments = async () => {
      if (!currentUser) return;

      try {
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('studentId', '==', currentUser.uid),
          where('status', '==', 'pending')
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        
        for (const doc of paymentsSnapshot.docs) {
          const payment = doc.data();
          if (payment.orderId) {
            await verifyPayment(payment.orderId, payment.courseId);
          }
        }
      } catch (err) {
        console.error('Error checking pending payments:', err);
      }
    };

    checkPendingPayments();
  }, [currentUser]);

  const handleStartCourse = (courseId: string) => {
    navigate(`/courses/${courseId}`);
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
    <div className="flex-1 flex flex-col">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <h1 className="text-xl font-bold dark:text-white">Courses</h1>
            <div className="flex space-x-1">
              {(['all', 'web', 'mobile', 'mind'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
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
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1 dark:text-white">{course.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{course.description}</p>

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
                          <span className="ml-2 text-sm text-gray-500 line-through">₹{course.originalPrice}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
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
