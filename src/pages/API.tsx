import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Copy, CheckCircle, AlertCircle, Shield, CreditCard, Banknote } from 'lucide-react';

interface StudentData {
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
  apiKey: string;
  status: 'pending' | 'verified' | 'rejected';
  registrationDate: Date;
}

export function API() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    pan: '',
    upi: '',
    aadhaar: '',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: ''
    }
  });
  const [documents, setDocuments] = useState({
    panImage: null as File | null,
    aadhaarFront: null as File | null,
    aadhaarBack: null as File | null
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      if (currentUser) {
        try {
          const studentsRef = collection(db, 'students');
          const q = query(studentsRef, where('userId', '==', currentUser.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const studentDoc = querySnapshot.docs[0];
            const data = studentDoc.data();
            setStudentData({
              id: studentDoc.id,
              name: data.name,
              email: data.email,
              pan: data.pan,
              upi: data.upi,
              aadhaar: data.aadhaar,
              bankDetails: data.bankDetails,
              documents: data.documents,
              apiKey: data.apiKey,
              status: data.status,
              registrationDate: data.registrationDate.toDate()
            });
          }
        } catch (err) {
          console.error('Error fetching student data:', err);
          setError('Failed to load student data');
        }
      }
      setLoading(false);
    };

    fetchStudentData();
  }, [currentUser]);

  const handleFileChange = (field: keyof typeof documents, file: File | null) => {
    if (file) {
      setDocuments(prev => ({ ...prev, [field]: file }));
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytes(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.then(async (snapshot: any) => {
        const downloadURL = await getDownloadURL(snapshot.ref);
        resolve(downloadURL);
      }).catch(reject);
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsRegistering(true);
    setError('');

    try {
      // Upload documents
      const documentUrls = {
        panImage: '',
        aadhaarFront: '',
        aadhaarBack: ''
      };

      if (documents.panImage) {
        documentUrls.panImage = await uploadFile(
          documents.panImage,
          `documents/${currentUser.uid}/pan/${documents.panImage.name}`
        );
      }

      if (documents.aadhaarFront) {
        documentUrls.aadhaarFront = await uploadFile(
          documents.aadhaarFront,
          `documents/${currentUser.uid}/aadhaar/front/${documents.aadhaarFront.name}`
        );
      }

      if (documents.aadhaarBack) {
        documentUrls.aadhaarBack = await uploadFile(
          documents.aadhaarBack,
          `documents/${currentUser.uid}/aadhaar/back/${documents.aadhaarBack.name}`
        );
      }

      // Generate a random API key
      const apiKey = `sk_${crypto.randomUUID().replace(/-/g, '')}`;

      // Create student document in Firestore
      const studentRef = await addDoc(collection(db, 'students'), {
        userId: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName,
        pan: formData.pan.trim().toUpperCase(),
        upi: formData.upi.trim().toLowerCase(),
        aadhaar: formData.aadhaar.trim(),
        bankDetails: formData.bankDetails,
        documents: documentUrls,
        apiKey,
        status: 'pending',
        registrationDate: new Date()
      });

      setStudentData({
        id: studentRef.id,
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        pan: formData.pan.trim().toUpperCase(),
        upi: formData.upi.trim().toLowerCase(),
        aadhaar: formData.aadhaar.trim(),
        bankDetails: formData.bankDetails,
        documents: documentUrls,
        apiKey,
        status: 'pending',
        registrationDate: new Date()
      });
    } catch (err) {
      console.error('Error registering student:', err);
      setError('Failed to register as student');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCopyApiKey = () => {
    if (studentData?.apiKey) {
      navigator.clipboard.writeText(studentData.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold p-4 text-gray-900 dark:text-white">API Access</h1>
      </div>

      <div className="flex-1 flex flex-col p-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {studentData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{studentData.name}</h2>
                  <p className="text-gray-600 dark:text-gray-300">{studentData.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {studentData.status === 'verified' && (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                  {studentData.status === 'pending' && (
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                  )}
                  <span className="capitalize text-gray-900 dark:text-white">{studentData.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">PAN Number</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{studentData.pan}</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">UPI ID</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{studentData.upi}</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">Aadhaar Number</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{studentData.aadhaar}</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <Banknote className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">Bank Details</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {studentData.bankDetails.accountHolderName}<br />
                    {studentData.bankDetails.accountNumber}<br />
                    {studentData.bankDetails.ifscCode}
                  </p>
                </div>
              </div>

              {studentData.status === 'verified' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Key
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={studentData.apiKey}
                        readOnly
                        className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={handleCopyApiKey}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 dark:text-gray-400">
                Registered on: {studentData.registrationDate.toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Get API Access</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Complete the verification process to get your API access.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={formData.pan}
                      onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value }))}
                      className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={formData.upi}
                      onChange={(e) => setFormData(prev => ({ ...prev, upi: e.target.value }))}
                      className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      value={formData.aadhaar}
                      onChange={(e) => setFormData(prev => ({ ...prev, aadhaar: e.target.value }))}
                      className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountHolderName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bankDetails: { ...prev.bankDetails, accountHolderName: e.target.value }
                        }))}
                        className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountNumber}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                        }))}
                        className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.ifscCode}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bankDetails: { ...prev.bankDetails, ifscCode: e.target.value }
                        }))}
                        className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        PAN Card Image
                      </label>
                      <input
                        type="file"
                        onChange={(e) => handleFileChange('panImage', e.target.files?.[0] || null)}
                        className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        accept="image/*"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Aadhaar Front
                      </label>
                      <input
                        type="file"
                        onChange={(e) => handleFileChange('aadhaarFront', e.target.files?.[0] || null)}
                        className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        accept="image/*"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Aadhaar Back
                      </label>
                      <input
                        type="file"
                        onChange={(e) => handleFileChange('aadhaarBack', e.target.files?.[0] || null)}
                        className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        accept="image/*"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    {isRegistering ? 'Registering...' : 'Submit Verification'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 