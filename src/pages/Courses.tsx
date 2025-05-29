import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Course } from '../components/dashboard/types';

export function Courses() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
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

    fetchCourses();
  }, []);

  const handlePurchase = async (courseId: string, price: number) => {
    if (!currentUser) {
      setError('Please log in to purchase courses');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, get the API token
      const tokenResponse = await fetch('https://us-central1-mydatabase-10917.cloudfunctions.net/getApiToken');
      const { token } = await tokenResponse.json();

      // Then make the payment request with the token
      const response = await fetch('https://us-central1-mydatabase-10917.cloudfunctions.net/generatePaymentLink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: price * 100, // Convert to paise
          currency: 'INR',
          planId: courseId,
          planName: courses.find(c => c.id === courseId)?.title || 'Course Purchase',
          studentId: currentUser.uid
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Initialize Razorpay
      const options = {
        key: data.razorpayKey,
        amount: data.amount,
        currency: data.currency,
        name: "f-Society",
        description: "Course Purchase",
        order_id: data.orderId,
        handler: function (response: any) {
          // Handle successful payment
          verifyPayment(response);
        },
        prefill: {
          name: currentUser.displayName || '',
          email: currentUser.email || ''
        },
        theme: {
          color: "#2563EB"
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (response: any) => {
    try {
      const tokenResponse = await fetch('https://us-central1-mydatabase-10917.cloudfunctions.net/getApiToken');
      const { token } = await tokenResponse.json();

      const verifyResponse = await fetch('https://us-central1-mydatabase-10917.cloudfunctions.net/verifyPaymentStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature
        })
      });

      const data = await verifyResponse.json();
      if (data.status === 'success') {
        // Show success message and refresh course list
        setError('');
        // You might want to show a success message to the user
      } else {
        setError('Payment verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify payment');
    }
  };

  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(course => course.category === selectedCategory);

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
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {filteredCourses.map(course => (
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
                        <button
                          onClick={() => handlePurchase(course.id, course.price)}
                          disabled={loading}
                          className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          <span>Enroll</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
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