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
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
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

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData: User[] = usersSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          name: doc.data().name || '',
          email: doc.data().email || '',
          photoURL: doc.data().photoURL || '',
          isAdmin: doc.data().isAdmin || false,
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        // Fetch posts
        const postsSnapshot = await getDocs(collection(db, 'posts'));
        const postsData: Post[] = postsSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          content: doc.data().content || '',
          authorId: doc.data().authorId || '',
          authorName: doc.data().authorName || '',
          authorAvatar: doc.data().authorAvatar || '',
          timestamp: doc.data().timestamp?.toDate() || new Date(),
          media: doc.data().media || [],
          stats: {
            likes: doc.data().stats?.likes || 0,
            comments: doc.data().stats?.comments || 0,
            shares: doc.data().stats?.shares || 0
          }
        }));

        setStudents(studentsData);
        setPaymentRequests(paymentsData);
        setUsers(usersData);
        setPosts(postsData);
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
    <div className="flex-1 flex flex-col bg-transparent">
      <h1 className="text-2xl font-bold mb-6 text-white">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="border-b border-gray-800">
          <nav className="-mb-px flex space-x-8">
            {(['students', 'payments', 'users', 'posts', 'courses'] as DashboardTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
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