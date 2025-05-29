import { useState } from 'react';
import { collection, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CheckCircle, XCircle, Eye, Mail, CreditCard, User, Calendar } from 'lucide-react';
import { Student } from './types';

interface StudentsTabProps {
  students: Student[];
  setStudents: (students: Student[]) => void;
  setError: (error: string) => void;
}

export function StudentsTab({ students, setStudents, setError }: StudentsTabProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);

  const handleVerifyStudent = async (studentId: string) => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (!studentDoc.exists()) {
        setError('Student not found');
        return;
      }

      const studentData = studentDoc.data();

      await updateDoc(doc(db, 'students', studentId), {
        status: 'verified',
        updatedAt: new Date()
      });

      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, status: 'verified' }
          : student
      ));

      await addDoc(collection(db, 'notifications'), {
        userId: studentData.userId,
        type: 'verification_status',
        title: 'Student Verification Approved',
        message: 'Your student verification has been approved. You can now use your API key for payments.',
        status: 'verified',
        read: false,
        createdAt: new Date(),
        link: '/dashboard'
      });

      setError('');
    } catch (err) {
      console.error('Error in handleVerifyStudent:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify student');
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (!studentDoc.exists()) {
        setError('Student not found');
        return;
      }

      const studentData = studentDoc.data();

      await updateDoc(doc(db, 'students', studentId), {
        status: 'rejected',
        updatedAt: new Date()
      });

      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, status: 'rejected' }
          : student
      ));

      await addDoc(collection(db, 'notifications'), {
        userId: studentData.userId,
        type: 'verification_status',
        title: 'Student Verification Rejected',
        message: 'Your student verification has been rejected. Please contact support for more information.',
        status: 'rejected',
        read: false,
        createdAt: new Date(),
        link: '/support'
      });

      setError('');
    } catch (err) {
      console.error('Error in handleRejectStudent:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject student');
    }
  };

  const handleViewDocuments = (student: Student) => {
    setSelectedStudent(student);
    setShowDocuments(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-white">Student Verifications</h2>
      
      <div className="space-y-4">
        {students.map(student => (
          <div key={student.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold dark:text-white">{student.name}</h3>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(student.status)}`}>
                  {student.status}
                </span>
              </div>
              <div className="flex items-center mt-3 text-gray-600 dark:text-gray-400">
                <Mail className="h-5 w-5 mr-2" />
                <span className="text-base">{student.email}</span>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <CreditCard className="h-5 w-5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">PAN Number</p>
                    <p className="font-medium dark:text-white">{student.pan}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <CreditCard className="h-5 w-5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">UPI ID</p>
                    <p className="font-medium dark:text-white">{student.upi}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <User className="h-5 w-5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aadhaar Number</p>
                    <p className="font-medium dark:text-white">{student.aadhaar}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Registration Date</p>
                    <p className="font-medium dark:text-white">{student.registrationDate.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => handleViewDocuments(student)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                title="View Documents"
              >
                <Eye className="h-5 w-5 mr-2" />
                View Documents
              </button>
              {student.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleVerifyStudent(student.id)}
                    className="px-4 py-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex items-center"
                    title="Verify Student"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Verify
                  </button>
                  <button
                    onClick={() => handleRejectStudent(student.id)}
                    className="px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center"
                    title="Reject Student"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Document Preview Modal */}
      {showDocuments && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold dark:text-white">Student Documents</h3>
              <button
                onClick={() => setShowDocuments(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-3 dark:text-white">PAN Card</h4>
                  <img
                    src={selectedStudent.documents.panImage}
                    alt="PAN Card"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-3 dark:text-white">Aadhaar Front</h4>
                  <img
                    src={selectedStudent.documents.aadhaarFront}
                    alt="Aadhaar Front"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-3 dark:text-white">Aadhaar Back</h4>
                  <img
                    src={selectedStudent.documents.aadhaarBack}
                    alt="Aadhaar Back"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-4 dark:text-white">Bank Details</h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Account Holder</p>
                    <p className="text-lg font-medium dark:text-white">{selectedStudent.bankDetails.accountHolderName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Account Number</p>
                    <p className="text-lg font-medium dark:text-white">{selectedStudent.bankDetails.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">IFSC Code</p>
                    <p className="text-lg font-medium dark:text-white">{selectedStudent.bankDetails.ifscCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 