import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { Request, Response } from 'express';

interface StudentData {
  userId: string;
  name: string;
  email: string;
  upi: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

// Register Student
export const registerStudent = async (req: Request, res: Response) => {
  const db = getFirestore();
  const data: StudentData = req.body;
  // Validate required fields
  const requiredFields = ['userId', 'name', 'email', 'upi', 'bankDetails'];
  for (const field of requiredFields) {
    if (!data[field as keyof StudentData]) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  // Check if student already exists
  const studentRef = db.collection('students').doc(data.userId);
  const studentDoc = await studentRef.get();
  if (studentDoc.exists) {
    return res.status(400).json({ error: 'Student already registered' });
  }

  // Generate API key
  const apiKey = crypto.randomBytes(32).toString('hex');

  // Add student to database
  await studentRef.set({
    ...data,
    apiKey,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Add notification
  await db.collection('notifications').add({
    userId: data.userId,
    type: 'REGISTRATION',
    message: 'Student registration successful',
    createdAt: new Date()
  });

  return res.status(200).json({ success: true, apiKey });
};

// Update Student API Key
export const updateStudentApiKey = async (req: Request, res: Response) => {
  const db = getFirestore();
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing required field: userId' });
  }

  const studentRef = db.collection('students').doc(userId);
  const studentDoc = await studentRef.get();
  
  if (!studentDoc.exists) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const newApiKey = crypto.randomBytes(32).toString('hex');
  
  await studentRef.update({
    apiKey: newApiKey,
    updatedAt: new Date()
  });

  // Add notification
  await db.collection('notifications').add({
    userId,
    type: 'API_KEY_UPDATE',
    message: 'API key updated successfully',
    createdAt: new Date()
  });

  return res.status(200).json({ success: true, apiKey: newApiKey });
}; 