import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { Plus, Edit, Trash2, CheckCircle, Upload, Users } from 'lucide-react';
import { Course, CourseClass, CourseMaterial } from './types';

interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  paymentDetails: {
    orderId: string;
    paymentId: string;
    amount: number;
  };
  studentName?: string;
  studentEmail?: string;
  courseTitle?: string;
}

interface FirestoreDoc {
  id: string;
  data: () => Record<string, any>;
}

export function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [currentStep, setCurrentStep] = useState<'details' | 'classes'>('details');
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    price: 0,
    originalPrice: 0,
    features: [],
    category: 'web',
    level: 'beginner',
    classes: [],
    totalClasses: 0
  });
  const [newClass, setNewClass] = useState<Partial<CourseClass>>({
    title: '',
    description: '',
    materials: [],
    instructions: '',
    order: 0
  });
  const [activeTab, setActiveTab] = useState<'courses' | 'enrollments'>('courses');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});

  const fetchCourses = async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnapshot.docs.map((doc: FirestoreDoc) => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async () => {
    try {
      const courseData = {
        ...newCourse,
        features: newCourse.features?.filter(f => f.trim() !== ''),
        createdAt: new Date()
      };

      await addDoc(collection(db, 'courses'), courseData);
      setShowNewCourseModal(false);
      setNewCourse({
        title: '',
        description: '',
        price: 0,
        originalPrice: 0,
        features: [],
        category: 'web',
        level: 'beginner',
        classes: [],
        totalClasses: 0
      });
      setCurrentStep('details');
      fetchCourses();
    } catch (err) {
      console.error('Error creating course:', err);
    }
  };

  const handleAddClass = () => {
    if (!newClass.title || !newClass.description) {
      return;
    }

    const classToAdd: CourseClass = {
      ...newClass as CourseClass,
      order: newCourse.classes?.length || 0
    };

    setNewCourse(prev => ({
      ...prev,
      classes: [...(prev.classes || []), classToAdd],
      totalClasses: (prev.totalClasses || 0) + 1
    }));

    setNewClass({
      title: '',
      description: '',
      materials: [],
      instructions: '',
      order: 0
    });
  };

  const handleAddMaterial = (type: CourseMaterial['type']) => {
    setNewClass(prev => ({
      ...prev,
      materials: [...(prev.materials || []), {
        type,
        url: '',
        title: '',
        description: ''
      }]
    }));
  };

  const handleFileUpload = async (file: File, materialIndex: number) => {
    try {
      const fileType = file.type.split('/')[0]; // 'video', 'image', 'application'
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const storagePath = `course-materials/${fileType}/${fileName}`;
      
      setUploadingFiles(prev => ({ ...prev, [materialIndex]: true }));

      // Upload file to Firebase Storage
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update the material URL in the state
      setNewClass(prev => ({
        ...prev,
        materials: prev.materials?.map((m, i) => 
          i === materialIndex ? { ...m, url: downloadURL } : m
        ) || []
      }));

      setUploadingFiles(prev => ({ ...prev, [materialIndex]: false }));
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadingFiles(prev => ({ ...prev, [materialIndex]: false }));
    }
  };

  const handleMaterialChange = (index: number, field: keyof CourseMaterial, value: string | File) => {
    if (field === 'url' && value instanceof File) {
      handleFileUpload(value, index);
    } else if (typeof value === 'string') {
      setNewClass(prev => ({
        ...prev,
        materials: prev.materials?.map((m, i) => 
          i === index ? { ...m, [field]: value } : m
        ) || []
      }));
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setNewClass(prev => ({
      ...prev,
      materials: prev.materials?.filter((_, i) => i !== index) || []
    }));
  };

  const handleUpdateCourse = async (courseId: string) => {
    if (!editingCourse) return;

    try {
      await updateDoc(doc(db, 'courses', courseId), {
        ...editingCourse,
        features: editingCourse.features.filter(f => f.trim() !== ''),
        updatedAt: new Date()
      });
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      console.error('Error updating course:', err);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      await deleteDoc(doc(db, 'courses', courseId));
      fetchCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    if (editingCourse) {
      setEditingCourse({
        ...editingCourse,
        features: editingCourse.features.map((f, i) => i === index ? value : f)
      });
    } else {
      setNewCourse(prev => ({
        ...prev,
        features: prev.features?.map((f, i) => i === index ? value : f) || ['']
      }));
    }
  };

  const handleAddFeature = () => {
    if (editingCourse) {
      setEditingCourse({
        ...editingCourse,
        features: [...editingCourse.features, '']
      });
    } else {
      setNewCourse(prev => ({
        ...prev,
        features: [...(prev.features || []), '']
      }));
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (editingCourse) {
      setEditingCourse({
        ...editingCourse,
        features: editingCourse.features.filter((_, i) => i !== index)
      });
    } else {
      setNewCourse(prev => ({
        ...prev,
        features: prev.features?.filter((_, i) => i !== index) || ['']
      }));
    }
  };

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const enrollmentsQuery = query(collection(db, 'enrollments'));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const enrollmentsData = enrollmentsSnapshot.docs.map((doc: FirestoreDoc) => ({
          id: doc.id,
          ...doc.data(),
          enrolledAt: doc.data().enrolledAt?.toDate()
        })) as Enrollment[];

        // Fetch additional details for each enrollment
        const enrichedEnrollments = await Promise.all(
          enrollmentsData.map(async (enrollment) => {
            const courseDoc = await getDoc(doc(db, 'courses', enrollment.courseId));
            const courseData = courseDoc.data();
            
            // Get user details from the payment details
            const userDoc = await getDoc(doc(db, 'users', enrollment.studentId));
            const userData = userDoc.data();

            return {
              ...enrollment,
              courseTitle: courseData?.title,
              studentName: userData?.displayName || 'Unknown',
              studentEmail: userData?.email || 'Unknown'
            };
          })
        );

        setEnrollments(enrichedEnrollments);
      } catch (err) {
        console.error('Error fetching enrollments:', err);
      } finally {
        setEnrollmentsLoading(false);
      }
    };

    if (activeTab === 'enrollments') {
      fetchEnrollments();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'courses'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'enrollments'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Enrollments</span>
            </div>
          </button>
        </div>
        {activeTab === 'courses' && (
          <button
            onClick={() => setShowNewCourseModal(true)}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Course</span>
          </button>
        )}
      </div>

      {activeTab === 'courses' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Course Management</h2>
          </div>

          <div className="space-y-4">
            {courses.map(course => (
              <div key={course.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
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
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full text-xs">
                          {course.category} - {course.level}
                        </span>
                        <button
                          onClick={() => setEditingCourse(course)}
                          className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {enrollmentsLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Enrolled Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {enrollment.studentName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {enrollment.studentEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {enrollment.courseTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          ₹{enrollment.paymentDetails.amount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {enrollment.paymentDetails.paymentId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {enrollment.enrolledAt.toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* New Course Modal */}
      {showNewCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">
                {currentStep === 'details' ? 'Create New Course' : 'Add Course Classes'}
              </h3>
              <button
                onClick={() => {
                  setShowNewCourseModal(false);
                  setCurrentStep('details');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {currentStep === 'details' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
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
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={newCourse.category}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Web Development, Mobile Apps, Mind Training"
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Level
                    </label>
                    <input
                      type="text"
                      value={newCourse.level}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, level: e.target.value }))}
                      placeholder="e.g., Beginner, Advanced, Expert"
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />
                  </div>
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
                          placeholder="Enter feature"
                          className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        />
                        <button
                          onClick={() => handleRemoveFeature(index)}
                          className="p-2 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddFeature}
                      className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Feature</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowNewCourseModal(false)}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setCurrentStep('classes')}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Next: Add Classes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-md font-medium mb-3 dark:text-white">Add New Class</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Class Title
                      </label>
                      <input
                        type="text"
                        value={newClass.title}
                        onChange={(e) => setNewClass(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Class Description
                      </label>
                      <textarea
                        value={newClass.description}
                        onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Instructions
                      </label>
                      <textarea
                        value={newClass.instructions}
                        onChange={(e) => setNewClass(prev => ({ ...prev, instructions: e.target.value }))}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Materials
                      </label>
                      <div className="space-y-2">
                        {newClass.materials?.map((material, index) => (
                          <div key={index} className="flex space-x-2">
                            <select
                              value={material.type}
                              onChange={(e) => handleMaterialChange(index, 'type', e.target.value as CourseMaterial['type'])}
                              className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                            >
                              <option value="video">Video</option>
                              <option value="image">Image</option>
                              <option value="pdf">PDF</option>
                              <option value="other">Other</option>
                            </select>
                            <input
                              type="text"
                              value={material.title}
                              onChange={(e) => handleMaterialChange(index, 'title', e.target.value)}
                              placeholder="Title"
                              className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                            />
                            <div className="flex-1 space-y-2">
                              {material.type === 'video' || material.type === 'image' || material.type === 'pdf' ? (
                                <>
                                  <div className="flex space-x-2">
                                    <input
                                      type="file"
                                      onChange={(e) => e.target.files?.[0] && handleMaterialChange(index, 'url', e.target.files[0])}
                                      accept={
                                        material.type === 'video' ? 'video/*' :
                                        material.type === 'image' ? 'image/*' :
                                        'application/pdf'
                                      }
                                      className="hidden"
                                      id={`file-upload-${index}`}
                                    />
                                    <label
                                      htmlFor={`file-upload-${index}`}
                                      className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                                    >
                                      {uploadingFiles[index] ? (
                                        <div className="flex items-center justify-center">
                                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                                          <span className="ml-2">Uploading...</span>
                                        </div>
                                      ) : material.url ? (
                                        <div className="flex items-center justify-between">
                                          <span className="truncate">{material.url.split('/').pop()}</span>
                                          <Upload className="h-4 w-4" />
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between">
                                          <span>Choose file</span>
                                          <Upload className="h-4 w-4" />
                                        </div>
                                      )}
                                    </label>
                                  </div>
                                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">OR</div>
                                </>
                              ) : null}
                              <input
                                type="text"
                                value={material.url}
                                onChange={(e) => handleMaterialChange(index, 'url', e.target.value)}
                                placeholder={material.type === 'video' || material.type === 'image' || material.type === 'pdf' ? 
                                  "Or enter URL directly" : "Enter URL"}
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveMaterial(index)}
                              className="p-2 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddMaterial('video')}
                            className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Video</span>
                          </button>
                          <button
                            onClick={() => handleAddMaterial('image')}
                            className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Image</span>
                          </button>
                          <button
                            onClick={() => handleAddMaterial('pdf')}
                            className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={handleAddClass}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        Add Class
                      </button>
                    </div>
                  </div>
                </div>

                {newCourse.classes && newCourse.classes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-md font-medium dark:text-white">Added Classes</h4>
                    {newCourse.classes.map((courseClass, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium dark:text-white">{courseClass.title}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{courseClass.description}</p>
                            <div className="mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {courseClass.materials.length} materials
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setNewCourse(prev => ({
                                ...prev,
                                classes: prev.classes?.filter((_, i) => i !== index) || []
                              }));
                            }}
                            className="p-1 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setCurrentStep('details')}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateCourse}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Create Course
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">
                {currentStep === 'details' ? 'Edit Course' : 'Edit Course Classes'}
              </h3>
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setCurrentStep('details');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {currentStep === 'details' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingCourse.description}
                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      value={editingCourse.price}
                      onChange={(e) => setEditingCourse({ ...editingCourse, price: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
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
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={editingCourse.category}
                      onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                      placeholder="e.g., Web Development, Mobile Apps, Mind Training"
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Level
                    </label>
                    <input
                      type="text"
                      value={editingCourse.level}
                      onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value })}
                      placeholder="e.g., Beginner, Advanced, Expert"
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />
                  </div>
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
                          onChange={(e) => {
                            const newFeatures = [...editingCourse.features];
                            newFeatures[index] = e.target.value;
                            setEditingCourse({ ...editingCourse, features: newFeatures });
                          }}
                          placeholder="Enter feature"
                          className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        />
                        <button
                          onClick={() => {
                            const newFeatures = editingCourse.features.filter((_, i) => i !== index);
                            setEditingCourse({ ...editingCourse, features: newFeatures });
                          }}
                          className="p-2 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
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
                      className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Feature</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingCourse(null)}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setCurrentStep('classes')}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Next: Edit Classes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-md font-medium mb-3 dark:text-white">Add New Class</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Class Title
                      </label>
                      <input
                        type="text"
                        value={newClass.title}
                        onChange={(e) => setNewClass(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Class Description
                      </label>
                      <textarea
                        value={newClass.description}
                        onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Instructions
                      </label>
                      <textarea
                        value={newClass.instructions}
                        onChange={(e) => setNewClass(prev => ({ ...prev, instructions: e.target.value }))}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Materials
                      </label>
                      <div className="space-y-2">
                        {newClass.materials?.map((material, index) => (
                          <div key={index} className="flex space-x-2">
                            <select
                              value={material.type}
                              onChange={(e) => handleMaterialChange(index, 'type', e.target.value as CourseMaterial['type'])}
                              className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                            >
                              <option value="video">Video</option>
                              <option value="image">Image</option>
                              <option value="pdf">PDF</option>
                              <option value="other">Other</option>
                            </select>
                            <input
                              type="text"
                              value={material.title}
                              onChange={(e) => handleMaterialChange(index, 'title', e.target.value)}
                              placeholder="Title"
                              className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                            />
                            <div className="flex-1 space-y-2">
                              {material.type === 'video' || material.type === 'image' || material.type === 'pdf' ? (
                                <>
                                  <div className="flex space-x-2">
                                    <input
                                      type="file"
                                      onChange={(e) => e.target.files?.[0] && handleMaterialChange(index, 'url', e.target.files[0])}
                                      accept={
                                        material.type === 'video' ? 'video/*' :
                                        material.type === 'image' ? 'image/*' :
                                        'application/pdf'
                                      }
                                      className="hidden"
                                      id={`file-upload-${index}`}
                                    />
                                    <label
                                      htmlFor={`file-upload-${index}`}
                                      className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                                    >
                                      {uploadingFiles[index] ? (
                                        <div className="flex items-center justify-center">
                                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                                          <span className="ml-2">Uploading...</span>
                                        </div>
                                      ) : material.url ? (
                                        <div className="flex items-center justify-between">
                                          <span className="truncate">{material.url.split('/').pop()}</span>
                                          <Upload className="h-4 w-4" />
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between">
                                          <span>Choose file</span>
                                          <Upload className="h-4 w-4" />
                                        </div>
                                      )}
                                    </label>
                                  </div>
                                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">OR</div>
                                </>
                              ) : null}
                              <input
                                type="text"
                                value={material.url}
                                onChange={(e) => handleMaterialChange(index, 'url', e.target.value)}
                                placeholder={material.type === 'video' || material.type === 'image' || material.type === 'pdf' ? 
                                  "Or enter URL directly" : "Enter URL"}
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveMaterial(index)}
                              className="p-2 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddMaterial('video')}
                            className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Video</span>
                          </button>
                          <button
                            onClick={() => handleAddMaterial('image')}
                            className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Image</span>
                          </button>
                          <button
                            onClick={() => handleAddMaterial('pdf')}
                            className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={handleAddClass}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        Add Class
                      </button>
                    </div>
                  </div>
                </div>

                {editingCourse.classes && editingCourse.classes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-md font-medium dark:text-white">Existing Classes</h4>
                    {editingCourse.classes.map((courseClass, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium dark:text-white">{courseClass.title}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{courseClass.description}</p>
                            <div className="mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {courseClass.materials.length} materials
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setNewClass(courseClass);
                                setEditingCourse(prev => ({
                                  ...prev!,
                                  classes: prev?.classes?.filter((_, i) => i !== index) || []
                                }));
                              }}
                              className="p-1 text-blue-500 hover:text-blue-600"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingCourse(prev => ({
                                  ...prev!,
                                  classes: prev?.classes?.filter((_, i) => i !== index) || []
                                }));
                              }}
                              className="p-1 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setCurrentStep('details')}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleUpdateCourse(editingCourse.id)}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Update Course
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 