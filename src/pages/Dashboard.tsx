import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
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

export function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'payments'>('students');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);

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
      await updateDoc(doc(db, 'students', studentId), {
        status: 'verified',
        updatedAt: new Date()
      });

      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, status: 'verified' }
          : student
      ));

      // Create notification for student
      await addDoc(collection(db, 'notifications'), {
        type: 'verification_status',
        studentId,
        status: 'verified',
        message: 'Your student verification has been approved. You can now use your API key for payments.',
        createdAt: new Date()
      });
    } catch (err) {
      console.error('Error verifying student:', err);
      setError('Failed to verify student');
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    try {
      await updateDoc(doc(db, 'students', studentId), {
        status: 'rejected',
        updatedAt: new Date()
      });

      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, status: 'rejected' }
          : student
      ));

      // Create notification for student
      await addDoc(collection(db, 'notifications'), {
        type: 'verification_status',
        studentId,
        status: 'rejected',
        message: 'Your student verification has been rejected. Please contact support for more information.',
        createdAt: new Date()
      });
    } catch (err) {
      console.error('Error rejecting student:', err);
      setError('Failed to reject student');
    }
  };

  const handleViewDocuments = (student: Student) => {
    setSelectedStudent(student);
    setShowDocuments(true);
  };

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
      ) : (
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
      )}

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

            <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
} 