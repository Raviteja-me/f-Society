import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import fetch from 'node-fetch';
import cors from 'cors';
import { Request, Response } from 'express';

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

// Helper function to validate token
function validateToken(req: Request): boolean {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token === process.env.FSOCIETY_TOKEN;
}

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
    pan, 
    upi, 
    aadhaar,
    bankDetails,
    documents 
  } = req.body;

  if (!userId || !name || !email || !pan || !upi || !aadhaar || !bankDetails || !documents) {
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
      pan,
      upi,
      aadhaar,
      bankDetails,
      documents,
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

// Generate Payment Link for Students
export const generateStudentPaymentLink = onRequest({ cors: true }, async (req: Request, res: Response) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { apiKey, amount, currency, planId, planName } = req.body;

    // Validate API key
    const { isValid, studentId } = await validateStudentApiKey(apiKey);
    if (!isValid || !studentId) {
      res.status(403).json({ error: 'Invalid or unverified API key' });
      return;
    }

    // Validate required fields
    if (!amount || !currency || !planId || !planName) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Get token from config
    const token = process.env.FSOCIETY_TOKEN;
    if (!token) {
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // Generate payment link
    const response = await fetch('https://lazyjobseeker.com/generatePaymentLink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount,
        currency,
        planId,
        planName,
        studentId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate payment link');
    }

    // Store payment request
    await db.collection('payment_requests').doc(data.orderId).set({
      studentId,
      planId,
      planName,
      amount,
      orderId: data.orderId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json(data);
  } catch (error) {
    console.error('Error generating payment link:', error);
    res.status(500).json({ 
      error: 'Failed to generate payment link',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Verify Student Payment
export const verifyStudentPayment = onRequest({ cors: true }, async (req: Request, res: Response) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const { apiKey, orderId, paymentId, signature } = req.body;

  // Validate API key
  const { isValid } = await validateStudentApiKey(apiKey);
  if (!isValid) {
    res.status(403).json({ error: 'Invalid or unverified API key' });
    return;
  }

  if (!orderId || !paymentId || !signature) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    // Get token from config
    const token = process.env.FSOCIETY_TOKEN;

    // Verify payment
    const response = await fetch('https://lazyjobseeker.com/verifyPaymentStatus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature
      })
    });

    const data = await response.json();

    if (data.status === 'success') {
      // Update payment request status
      await db.collection('payment_requests').doc(orderId).update({
        status: 'success',
        paymentId,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('payment_requests').doc(orderId).update({
        status: 'failed',
        reason: data.reason || 'Payment verification failed',
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
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