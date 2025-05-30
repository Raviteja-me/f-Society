import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { StudentsTab } from '../components/dashboard/StudentsTab';
import { PaymentsTab } from '../components/dashboard/PaymentsTab';
import { UsersTab } from '../components/dashboard/UsersTab';
import { PostsTab } from '../components/dashboard/PostsTab';
import { CoursesTab } from '../components/dashboard/CoursesTab';
import { Student, PaymentRequest, User, Post, DashboardTab } from '../components/dashboard/types';

export function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [users] = useState<User[]>([]);
  const [posts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<DashboardTab>('students');

  useEffect(() => {
    const verifyAdminAndFetchData = async () => {
      if (!currentUser) {
        setError('Please log in to access the dashboard');
        setLoading(false);
        navigate('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        if (!userDoc.exists()) {
          setError('User profile not found');
          setLoading(false);
          navigate('/');
          return;
        }

        if (!userData?.isAdmin) {
          setError('You do not have permission to access the dashboard');
          setLoading(false);
          navigate('/');
          return;
        }

        // Fetch students
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const studentsData: Student[] = studentsSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          name: doc.data().name || '',
          email: doc.data().email || '',
          pan: doc.data().pan || '',
          upi: doc.data().upi || '',
          aadhaar: doc.data().aadhaar || '',
          bankDetails: {
            accountNumber: doc.data().bankDetails?.accountNumber || '',
            ifscCode: doc.data().bankDetails?.ifscCode || '',
            accountHolderName: doc.data().bankDetails?.accountHolderName || ''
          },
          documents: {
            panImage: doc.data().documents?.panImage || '',
            aadhaarFront: doc.data().documents?.aadhaarFront || '',
            aadhaarBack: doc.data().documents?.aadhaarBack || ''
          },
          status: doc.data().status || 'pending',
          registrationDate: doc.data().registrationDate?.toDate() || new Date()
        }));

        // Fetch payment requests
        const paymentsSnapshot = await getDocs(collection(db, 'payment_requests'));
        const paymentsData: PaymentRequest[] = paymentsSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          studentId: doc.data().studentId || '',
          studentEmail: doc.data().studentEmail || '',
          planId: doc.data().planId || '',
          planName: doc.data().planName || '',
          amount: doc.data().amount || 0,
          status: doc.data().status || 'pending',
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          verifiedAt: doc.data().verifiedAt?.toDate()
        }));

        setStudents(studentsData);
        setPaymentRequests(paymentsData);
        setError('');
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    verifyAdminAndFetchData();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {(['students', 'payments', 'users', 'posts', 'courses'] as DashboardTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'students' && (
        <StudentsTab
          students={students}
          setStudents={setStudents}
          setError={setError}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentsTab paymentRequests={paymentRequests} />
      )}

      {activeTab === 'users' && (
        <UsersTab
          users={users}
          setError={setError}
        />
      )}

      {activeTab === 'posts' && (
        <PostsTab posts={posts} setError={setError} />
      )}

      {activeTab === 'courses' && (
        <CoursesTab />
      )}
    </div>
  );
} 