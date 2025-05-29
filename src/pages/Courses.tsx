import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Play, FileText, ArrowRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  category: 'web' | 'mobile' | 'mind';
  level: 'frontend' | 'fullstack';
  image: string;
}

const courses: Course[] = [
  {
    id: 'web-frontend',
    title: 'AI Web Development - Frontend',
    description: 'Learn to build professional websites without coding. Master design, animations, and deployment.',
    price: 499,
    originalPrice: 999,
    category: 'web',
    level: 'frontend',
    image: '/courses/web-frontend.jpg',
    features: [
      'Build websites from scratch',
      'Add designs and animations',
      'Make websites reactive and professional',
      'Deploy and host projects',
      'Set up CI/CD pipelines',
      'Edit existing projects',
      'Import and modify code',
      'No coding required'
    ]
  },
  {
    id: 'web-fullstack',
    title: 'AI Web Development - Full Stack',
    description: 'Master full-stack development with authentication, databases, and APIs - all without coding.',
    price: 999,
    originalPrice: 1999,
    category: 'web',
    level: 'fullstack',
    image: '/courses/web-fullstack.jpg',
    features: [
      'Everything from Frontend course',
      'Authentication systems',
      'Database integration',
      'API development',
      'Backend services',
      'Full-stack deployment',
      'Real-time features',
      'No coding required'
    ]
  },
  {
    id: 'mobile-frontend',
    title: 'AI Mobile Development - Frontend',
    description: 'Create stunning mobile apps with beautiful UI/UX - no coding required.',
    price: 799,
    originalPrice: 1599,
    category: 'mobile',
    level: 'frontend',
    image: '/courses/mobile-frontend.jpg',
    features: [
      'Build mobile apps from scratch',
      'Design beautiful interfaces',
      'Add animations and transitions',
      'Create responsive layouts',
      'Implement navigation',
      'Add user interactions',
      'Deploy to app stores',
      'No coding required'
    ]
  },
  {
    id: 'mobile-fullstack',
    title: 'AI Mobile Development - Full Stack',
    description: 'Master full-stack mobile development with backend integration and APIs.',
    price: 1499,
    originalPrice: 2999,
    category: 'mobile',
    level: 'fullstack',
    image: '/courses/mobile-fullstack.jpg',
    features: [
      'Everything from Frontend course',
      'Backend integration',
      'API development',
      'Database management',
      'User authentication',
      'Push notifications',
      'Cloud services',
      'No coding required'
    ]
  },
  {
    id: 'mind-training',
    title: 'Mind Training Course',
    description: 'Overcome life challenges, build confidence, and achieve your goals.',
    price: 499,
    originalPrice: 999,
    category: 'mind',
    level: 'frontend',
    image: '/courses/mind-training.jpg',
    features: [
      'Overcome life challenges',
      'Build self-confidence',
      'Set and achieve goals',
      'Develop positive mindset',
      'Handle stress effectively',
      'Improve productivity',
      'Enhance relationships',
      'Transform your life'
    ]
  }
];

export function Courses() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'web' | 'mobile' | 'mind'>('all');

  const handlePurchase = async (courseId: string, price: number) => {
    if (!currentUser) {
      // Handle not logged in
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create payment request
      const response = await fetch('https://createpaymentlink-net74gl7ba-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_API_TOKEN}`
        },
        body: JSON.stringify({
          amount: price,
          currency: 'INR',
          planId: courseId,
          planName: courses.find(c => c.id === courseId)?.title || 'Course Purchase'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Redirect to payment page
      window.location.href = data.paymentUrl;
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(course => course.category === selectedCategory);

  return (
    <div className="flex-1 flex flex-col">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold dark:text-white">Courses</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory('web')}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === 'web'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Web Development
              </button>
              <button
                onClick={() => setSelectedCategory('mobile')}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === 'mobile'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Mobile Development
              </button>
              <button
                onClick={() => setSelectedCategory('mind')}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === 'mind'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Mind Training
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105"
            >
              <div className="relative h-48">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                {course.originalPrice && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full">
                    {Math.round((1 - course.price / course.originalPrice) * 100)}% OFF
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 dark:text-white">{course.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>

                <div className="space-y-2 mb-6">
                  {course.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-500">₹{course.price}</span>
                    {course.originalPrice && (
                      <span className="ml-2 text-gray-500 line-through">₹{course.originalPrice}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handlePurchase(course.id, course.price)}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <span>Enroll Now</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 