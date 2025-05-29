import { useState } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Course } from './types';

interface CoursesTabProps {
  courses: Course[];
  setError: (error: string) => void;
  fetchCourses: () => Promise<void>;
}

export function CoursesTab({ courses, setError, fetchCourses }: CoursesTabProps) {
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
        features: [''],
        category: 'web',
        level: 'frontend',
        image: ''
      });
      fetchCourses();
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err instanceof Error ? err.message : 'Failed to create course');
    }
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
      setError(err instanceof Error ? err.message : 'Failed to update course');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      await deleteDoc(doc(db, 'courses', courseId));
      fetchCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete course');
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold dark:text-white">Course Management</h2>
        <button
          onClick={() => setShowNewCourseModal(true)}
          className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Course</span>
        </button>
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

      {/* New Course Modal */}
      {showNewCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Create New Course</h3>
              <button
                onClick={() => setShowNewCourseModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

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
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value as 'web' | 'mobile' | 'mind' }))}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
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
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  >
                    <option value="frontend">Frontend</option>
                    <option value="fullstack">Full Stack</option>
                  </select>
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
                  onClick={handleCreateCourse}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Edit Course</h3>
              <button
                onClick={() => setEditingCourse(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

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
                  <select
                    value={editingCourse.category}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value as 'web' | 'mobile' | 'mind' })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
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
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  >
                    <option value="frontend">Frontend</option>
                    <option value="fullstack">Full Stack</option>
                  </select>
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
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
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
                  onClick={() => handleUpdateCourse(editingCourse.id)}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Update Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 