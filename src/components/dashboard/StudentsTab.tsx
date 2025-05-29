import { useState } from 'react';
import { collection,  doc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
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

  return (
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
    </div>
  );
} 