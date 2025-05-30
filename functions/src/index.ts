import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import cors from 'cors';
import { Request, Response } from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from './razorpay';

admin.initializeApp();
const db = admin.firestore();

// Initialize CORS middleware
const corsMiddleware = cors({ 
  origin: ['https://fsociety.today', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Helper function to handle CORS
const corsHandler = (req: Request, res: Response, handler: () => Promise<void>): void => {
  corsMiddleware(req, res, () => {
    handler().catch(error => {
      console.error('Error in handler:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  });
};

// Helper function to validate student API key
async function validateStudentApiKey(apiKey: string): Promise<{ isValid: boolean; studentId?: string }> {
  try {
    const studentQuery = await db.collection('students')
      .where('apiKey', '==', apiKey)
      .limit(1)
      .get();

    if (studentQuery.empty) {
      return { isValid: false };
    }

    const student = studentQuery.docs[0];
    if (student.data().status !== 'verified') {
      return { isValid: false };
    }

    return { isValid: true, studentId: student.id };
  } catch (error) {
    console.error('Error validating student API key:', error);
    return { isValid: false };
  }
}

// Register Student
export const registerStudent = onRequest({ cors: true }, async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { 
    userId,
    name, 
    email, 
    upi, 
    bankDetails
  } = req.body;

  if (!userId || !name || !email || !upi || !bankDetails) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existingStudent = await db.collection('students')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingStudent.empty) {
      res.status(400).json({ error: 'User is already registered as a student' });
      return;
    }

    const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex');

    const studentRef = await db.collection('students').add({
      userId,
      name,
      email,
      upi,
      bankDetails,
      apiKey,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('notifications').add({
      type: 'new_student',
      studentId: studentRef.id,
      studentName: name,
      studentEmail: email,
      status: 'unread',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ 
      message: 'Registration successful. Your application is under review.',
      studentId: studentRef.id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error registering student:', error);
    res.status(500).json({ error: 'Failed to register student' });
  }
});

// Update Student API Key
export const updateStudentApiKey = onRequest({ cors: true }, async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { studentId, currentApiKey } = req.body;

  if (!studentId || !currentApiKey) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    // Validate current API key
    const { isValid } = await validateStudentApiKey(currentApiKey);
    if (!isValid) {
      res.status(403).json({ error: 'Invalid API key' });
      return;
    }

    // Generate new API key
    const newApiKey = 'sk_' + crypto.randomBytes(32).toString('hex');

    // Update student document
    await db.collection('students').doc(studentId).update({
      apiKey: newApiKey,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      message: 'API key updated successfully',
      newApiKey
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Export Razorpay functions
export { createRazorpayOrder, verifyRazorpayPayment }; 