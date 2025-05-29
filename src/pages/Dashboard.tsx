import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { CheckCircle, XCircle, Eye, Send, Plus, Edit, Trash2, } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: string;
  name: string;
  email: string;
  pan: string;
  upi: string;
  aadhaar: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  documents: {
    panImage: string;
    aadhaarFront: string;
    aadhaarBack: string;
  };
  status: 'pending' | 'verified' | 'rejected';
  registrationDate: Date;
}

interface PaymentRequest {
  id: string;
  studentId: string;
  studentEmail: string;
  planId: string;
  planName: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
  verifiedAt?: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  isAdmin: boolean;
  createdAt: Date;
}

interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  timestamp: Date;
  media: Array<{
    url: string;
    type: string;
    filename: string;
  }>;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
}

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

export function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'payments' | 'users' | 'posts' | 'courses'>('students');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    price: 0,
    originalPrice: 0,
    features: [''],
    category: 'web',
    level: 'frontend',
    image: ''
  });

  useEffect(() => {
    const verifyAdminAndFetchData = async () => {
      console.log('Starting admin verification process...');
      console.log('Current user:', currentUser);
      
      if (!currentUser) {
        console.error('No current user found');
        setError('Please log in to access the dashboard');
        setLoading(false);
        navigate('/');
        return;
      }

      try {
        console.log('Fetching user document for:', currentUser.uid);
        // Verify admin status
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        console.log('User document exists:', userDoc.exists());
        console.log('User data:', userData);
        console.log('Is admin:', userData?.isAdmin);
        
        if (!userDoc.exists()) {
          console.error('User document does not exist');
          setError('User profile not found');
          setLoading(false);
          navigate('/');
          return;
        }

        if (!userData?.isAdmin) {
          console.error('User is not an admin');
          setError('You do not have permission to access the dashboard');
          setLoading(false);
          navigate('/');
          return;
        }

        console.log('Admin verification successful, fetching data...');
        
        // Fetch students
        console.log('Attempting to fetch students collection...');
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        console.log('Students snapshot:', studentsSnapshot.docs.length, 'documents found');
        
        const studentsData: Student[] = studentsSnapshot.docs.map((doc: any) => {
          const data = doc.data();
          console.log('Processing student document:', doc.id, data);
          
          return {
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            pan: data.pan || '',
            upi: data.upi || '',
            aadhaar: data.aadhaar || '',
            bankDetails: {
              accountNumber: data.bankDetails?.accountNumber || '',
              ifscCode: data.bankDetails?.ifscCode || '',
              accountHolderName: data.bankDetails?.accountHolderName || ''
            },
            documents: {
              panImage: data.documents?.panImage || '',
              aadhaarFront: data.documents?.aadhaarFront || '',
              aadhaarBack: data.documents?.aadhaarBack || ''
            },
            status: data.status || 'pending',
            registrationDate: data.registrationDate?.toDate() || new Date()
          };
        });

        // Fetch payment requests
        console.log('Attempting to fetch payment_requests collection...');
        const paymentsSnapshot = await getDocs(collection(db, 'payment_requests'));
        console.log('Payments snapshot:', paymentsSnapshot.docs.length, 'documents found');
        
        const paymentsData: PaymentRequest[] = paymentsSnapshot.docs.map((doc: any) => {
          const data = doc.data();
          console.log('Processing payment document:', doc.id, data);
          
          return {
            id: doc.id,
            studentId: data.studentId || '',
            studentEmail: data.studentEmail || '',
            planId: data.planId || '',
            planName: data.planName || '',
            amount: data.amount || 0,
            status: data.status || 'pending',
            createdAt: data.createdAt?.toDate() || new Date(),
            verifiedAt: data.verifiedAt?.toDate()
          };
        });

        console.log('Successfully processed all data');
        setStudents(studentsData);
        setPaymentRequests(paymentsData);
        setError('');
      } catch (err) {
        console.error('Detailed error in fetchData:', err);
        if (err instanceof Error) {
          setError(`Failed to load dashboard data: ${err.message}`);
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAdminAndFetchData();
  }, [currentUser, navigate]);

  const handleVerifyStudent = async (studentId: string) => {
    try {
      console.log('Starting student verification for:', studentId);
      
      // First, get the current student document
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (!studentDoc.exists()) {
        console.error('Student document not found:', studentId);
        setError('Student not found');
        return;
      }

      const studentData = studentDoc.data();
      console.log('Current student data:', studentData);

      // Update the student document
      console.log('Updating student status to verified...');
      await updateDoc(doc(db, 'students', studentId), {
        status: 'verified',
        updatedAt: new Date()
      });

      console.log('Student document updated successfully');

      // Update local state
      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, status: 'verified' }
          : student
      ));

      // Create notification for student
      console.log('Creating notification for student...');
      await addDoc(collection(db, 'notifications'), {
        userId: studentData.userId, // Make sure this matches your student document structure
        type: 'verification_status',
        title: 'Student Verification Approved',
        message: 'Your student verification has been approved. You can now use your API key for payments.',
        status: 'verified',
        read: false,
        createdAt: new Date(),
        link: '/dashboard' // Optional: link to relevant page
      });

      console.log('Notification created successfully');
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Detailed error in handleVerifyStudent:', err);
      if (err instanceof Error) {
        setError(`Failed to verify student: ${err.message}`);
      } else {
        setError('Failed to verify student');
      }
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    try {
      console.log('Starting student rejection for:', studentId);
      
      // First, get the current student document
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (!studentDoc.exists()) {
        console.error('Student document not found:', studentId);
        setError('Student not found');
        return;
      }

      const studentData = studentDoc.data();
      console.log('Current student data:', studentData);

      // Update the student document
      console.log('Updating student status to rejected...');
      await updateDoc(doc(db, 'students', studentId), {
        status: 'rejected',
        updatedAt: new Date()
      });

      console.log('Student document updated successfully');

      // Update local state
      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, status: 'rejected' }
          : student
      ));

      // Create notification for student
      console.log('Creating notification for student...');
      await addDoc(collection(db, 'notifications'), {
        userId: studentData.userId, // Make sure this matches your student document structure
        type: 'verification_status',
        title: 'Student Verification Rejected',
        message: 'Your student verification has been rejected. Please contact support for more information.',
        status: 'rejected',
        read: false,
        createdAt: new Date(),
        link: '/support' // Optional: link to support page
      });

      console.log('Notification created successfully');
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Detailed error in handleRejectStudent:', err);
      if (err instanceof Error) {
        setError(`Failed to reject student: ${err.message}`);
      } else {
        setError('Failed to reject student');
      }
    }
  };

  const handleViewDocuments = (student: Student) => {
    setSelectedStudent(student);
    setShowDocuments(true);
  };

  const handleCreatePost = async () => {
    try {
      if (!currentUser) return;
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      const newPost = {
        content: newPostContent,
        authorId: currentUser.uid,
        authorName: userData?.name || 'Admin',
        authorAvatar: userData?.photoURL || '',
        timestamp: new Date(),
        media: [],
        stats: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

      await addDoc(collection(db, 'posts'), newPost);
      setNewPostContent('');
      setShowNewPostModal(false);
      // Refresh posts
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    }
  };

  const handleSendNotification = async (userId: string) => {
    try {
      if (!notificationMessage.trim()) return;

      await addDoc(collection(db, 'notifications'), {
        userId,
        message: notificationMessage,
        type: 'admin_notification',
        createdAt: new Date(),
        read: false
      });

      setNotificationMessage('');
      setSelectedUser(null);
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('Failed to send notification');
    }
  };

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as User[];
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    }
  };

  const fetchPosts = async () => {
    try {
      const postsSnapshot = await getDocs(collection(db, 'posts'));
      const postsData = postsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Post[];
      setPosts(postsData);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to fetch posts');
    }
  };

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
      setError('Failed to fetch courses');
    }
  };

  const handleCreateCourse = async () => {
    if (!currentUser) {
      setError('Please log in to create courses');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const courseData = {
        ...newCourse,
        features: newCourse.features?.filter(f => f.trim() !== ''),
        createdBy: currentUser.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'courses'), courseData);
      setShowNewCourseModal(false);
      setNewCourse({
        title: '',
        description: '',
        price: 0,
        originalPrice: 0,
        features: [''],
        category: 'web',
        level: 'frontend',
        image: ''
      });
      fetchCourses();
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (courseId: string) => {
    if (!editingCourse || !currentUser) return;

    setLoading(true);
    setError('');

    try {
      await updateDoc(doc(db, 'courses', courseId), {
        ...editingCourse,
        features: editingCourse.features.filter(f => f.trim() !== ''),
        updatedBy: currentUser.uid,
        updatedAt: new Date()
      });
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      console.error('Error updating course:', err);
      setError(err instanceof Error ? err.message : 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!currentUser) {
      setError('Please log in to delete courses');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this course?')) return;

    setLoading(true);
    setError('');

    try {
      await deleteDoc(doc(db, 'courses', courseId));
      fetchCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = () => {
    setNewCourse(prev => ({
      ...prev,
      features: [...(prev.features || []), '']
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setNewCourse(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    if (editingCourse) {
      setEditingCourse({
        ...editingCourse,
        features: editingCourse.features.map((f, i) => i === index ? value : f)
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'courses') {
      fetchCourses();
    }
  }, [activeTab]);

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
            <button
              onClick={() => setActiveTab('students')}
              className={`${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Payments
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`${
                activeTab === 'courses'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Courses
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'students' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Student Verifications</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 dark:text-white">Name</th>
                  <th className="text-left py-2 dark:text-white">Email</th>
                  <th className="text-left py-2 dark:text-white">PAN</th>
                  <th className="text-left py-2 dark:text-white">UPI</th>
                  <th className="text-left py-2 dark:text-white">Aadhaar</th>
                  <th className="text-left py-2 dark:text-white">Status</th>
                  <th className="text-left py-2 dark:text-white">Registered</th>
                  <th className="text-left py-2 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} className="border-b dark:border-gray-700">
                    <td className="py-2 dark:text-white">{student.name}</td>
                    <td className="py-2 dark:text-white">{student.email}</td>
                    <td className="py-2 dark:text-white">{student.pan}</td>
                    <td className="py-2 dark:text-white">{student.upi}</td>
                    <td className="py-2 dark:text-white">{student.aadhaar}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        student.status === 'verified' ? 'bg-green-100 text-green-800' :
                        student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="py-2 dark:text-white">{student.registrationDate.toLocaleDateString()}</td>
                    <td className="py-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDocuments(student)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="View Documents"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {student.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerifyStudent(student.id)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Verify Student"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleRejectStudent(student.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Reject Student"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'payments' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 dark:text-white">Student</th>
                  <th className="text-left py-2 dark:text-white">Plan</th>
                  <th className="text-left py-2 dark:text-white">Amount</th>
                  <th className="text-left py-2 dark:text-white">Status</th>
                  <th className="text-left py-2 dark:text-white">Created</th>
                  <th className="text-left py-2 dark:text-white">Verified</th>
                </tr>
              </thead>
              <tbody>
                {paymentRequests.map(payment => (
                  <tr key={payment.id} className="border-b dark:border-gray-700">
                    <td className="py-2 dark:text-white">{payment.studentEmail}</td>
                    <td className="py-2 dark:text-white">{payment.planName}</td>
                    <td className="py-2 dark:text-white">${payment.amount.toFixed(2)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        payment.status === 'success' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-2 dark:text-white">{payment.createdAt.toLocaleDateString()}</td>
                    <td className="py-2 dark:text-white">
                      {payment.verifiedAt ? payment.verifiedAt.toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">User Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 dark:text-white">User</th>
                  <th className="text-left py-2 dark:text-white">Email</th>
                  <th className="text-left py-2 dark:text-white">Role</th>
                  <th className="text-left py-2 dark:text-white">Joined</th>
                  <th className="text-left py-2 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b dark:border-gray-700">
                    <td className="py-2">
                      <div className="flex items-center space-x-2">
                        <img
                          src={user.photoURL}
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="dark:text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-2 dark:text-white">{user.email}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-2 dark:text-white">{user.createdAt.toLocaleDateString()}</td>
                    <td className="py-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Send Notification"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'posts' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold dark:text-white">Posts Management</h2>
            <button
              onClick={() => setShowNewPostModal(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <Plus className="h-5 w-5" />
              <span>New Post</span>
            </button>
          </div>
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium dark:text-white">{post.authorName}</span>
                  <span className="text-gray-500 text-sm">
                    {post.timestamp.toLocaleDateString()}
                  </span>
                </div>
                <p className="dark:text-white mb-2">{post.content}</p>
                {post.media && post.media.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {post.media.map((media, index) => (
                      media.type === 'image' ? (
                        <img
                          key={index}
                          src={media.url}
                          alt={`Media ${index + 1}`}
                          className="w-full rounded-lg"
                        />
                      ) : (
                        <video
                          key={index}
                          src={media.url}
                          controls
                          className="w-full rounded-lg"
                        />
                      )
                    ))}
                  </div>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>❤️ {post.stats.likes}</span>
                  <span>💬 {post.stats.comments}</span>
                  <span>🔄 {post.stats.shares}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'courses' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold dark:text-white">Course Management</h2>
            <button
              onClick={() => setShowNewCourseModal(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <Plus className="h-5 w-5" />
              <span>New Course</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="relative h-48 mb-4">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => setEditingCourse(course)}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2 dark:text-white">{course.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>

                <div className="space-y-2 mb-4">
                  {course.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-bold text-blue-500">₹{course.price}</span>
                    {course.originalPrice && (
                      <span className="ml-2 text-sm text-gray-500 line-through">₹{course.originalPrice}</span>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-full text-sm">
                    {course.category} - {course.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {/* Document Preview Modal */}
          {showDocuments && selectedStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold dark:text-white">Student Documents</h3>
                  <button
                    onClick={() => setShowDocuments(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 dark:text-white">PAN Card</h4>
                    <img
                      src={selectedStudent.documents.panImage}
                      alt="PAN Card"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 dark:text-white">Aadhaar Front</h4>
                    <img
                      src={selectedStudent.documents.aadhaarFront}
                      alt="Aadhaar Front"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 dark:text-white">Aadhaar Back</h4>
                    <img
                      src={selectedStudent.documents.aadhaarBack}
                      alt="Aadhaar Back"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 dark:text-white">Bank Details</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="dark:text-white">
                        <span className="font-medium">Account Holder:</span> {selectedStudent.bankDetails.accountHolderName}
                      </p>
                      <p className="dark:text-white">
                        <span className="font-medium">Account Number:</span> {selectedStudent.bankDetails.accountNumber}
                      </p>
                      <p className="dark:text-white">
                        <span className="font-medium">IFSC Code:</span> {selectedStudent.bankDetails.ifscCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Post Modal */}
          {showNewPostModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold dark:text-white">Create New Post</h3>
                  <button
                    onClick={() => setShowNewPostModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full h-32 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Write your post content..."
                />
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowNewPostModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Send Notification Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold dark:text-white">
                    Send Notification to {selectedUser.name}
                  </h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  className="w-full h-32 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Write your notification message..."
                />
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSendNotification(selectedUser.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Course Modal */}
          {showNewCourseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold dark:text-white">Create New Course</h3>
                  <button
                    onClick={() => setShowNewCourseModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={newCourse.price}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Original Price (₹)
                      </label>
                      <input
                        type="number"
                        value={newCourse.originalPrice}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={newCourse.category}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value as 'web' | 'mobile' | 'mind' }))}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="web">Web Development</option>
                        <option value="mobile">Mobile Development</option>
                        <option value="mind">Mind Training</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Level
                      </label>
                      <select
                        value={newCourse.level}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, level: e.target.value as 'frontend' | 'fullstack' }))}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="frontend">Frontend</option>
                        <option value="fullstack">Full Stack</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={newCourse.image}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Features
                    </label>
                    <div className="space-y-2">
                      {newCourse.features?.map((feature, index) => (
                        <div key={index} className="flex space-x-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => handleRemoveFeature(index)}
                            className="p-2 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={handleAddFeature}
                        className="flex items-center space-x-2 text-blue-500 hover:text-blue-600"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Add Feature</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowNewCourseModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCourse}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Create Course
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Course Modal */}
          {editingCourse && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold dark:text-white">Edit Course</h3>
                  <button
                    onClick={() => setEditingCourse(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editingCourse.title}
                      onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingCourse.description}
                      onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={editingCourse.price}
                        onChange={(e) => setEditingCourse({ ...editingCourse, price: Number(e.target.value) })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Original Price (₹)
                      </label>
                      <input
                        type="number"
                        value={editingCourse.originalPrice}
                        onChange={(e) => setEditingCourse({ ...editingCourse, originalPrice: Number(e.target.value) })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={editingCourse.category}
                        onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value as 'web' | 'mobile' | 'mind' })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="web">Web Development</option>
                        <option value="mobile">Mobile Development</option>
                        <option value="mind">Mind Training</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Level
                      </label>
                      <select
                        value={editingCourse.level}
                        onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value as 'frontend' | 'fullstack' })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="frontend">Frontend</option>
                        <option value="fullstack">Full Stack</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={editingCourse.image}
                      onChange={(e) => setEditingCourse({ ...editingCourse, image: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Features
                    </label>
                    <div className="space-y-2">
                      {editingCourse.features.map((feature, index) => (
                        <div key={index} className="flex space-x-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              setEditingCourse({
                                ...editingCourse,
                                features: editingCourse.features.filter((_, i) => i !== index)
                              });
                            }}
                            className="p-2 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setEditingCourse({
                            ...editingCourse,
                            features: [...editingCourse.features, '']
                          });
                        }}
                        className="flex items-center space-x-2 text-blue-500 hover:text-blue-600"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Add Feature</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingCourse(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateCourse(editingCourse.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Update Course
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 