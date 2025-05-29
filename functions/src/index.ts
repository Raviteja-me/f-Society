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

// Get API Token
export const getApiToken = onRequest({ cors: true }, async (req: Request, res: Response) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  res.json({ token: process.env.FSOCIETY_TOKEN });
});

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

// Create Payment Request
export const createPaymentRequest = onRequest({ cors: true }, async (req: Request, res: Response) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const { apiKey, amount, currency, planId, planName, studentId: providedStudentId } = req.body;

  let finalStudentId = providedStudentId;

  // If apiKey is provided, validate it (external student API)
  if (apiKey) {
    const { isValid, studentId: validatedStudentId } = await validateStudentApiKey(apiKey);
    if (!isValid) {
      res.status(403).json({ error: 'Invalid or unverified API key' });
      return;
    }
    // Use the validated studentId
    finalStudentId = validatedStudentId;
  }

  // For internal website purchases, studentId should be provided directly
  if (!finalStudentId || !amount || !currency || !planId || !planName) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    // Get token from config
    const token = process.env.FSOCIETY_TOKEN;

    // Generate payment link from lazyjobseeker.com
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
        studentId: finalStudentId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate payment link');
    }

    // Store payment request
    await db.collection('payment_requests').doc(data.orderId).set({
      studentId: finalStudentId,
      planId,
      planName,
      amount,
      orderId: data.orderId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      paymentUrl: data.paymentUrl,
      orderDetails: data
    });
  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({ error: 'Failed to create payment request' });
  }
});

// Verify Payment Status
export const verifyPaymentStatus = onRequest({ cors: true }, async (req: Request, res: Response) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const { apiKey, orderId, paymentId, signature } = req.body;

  // If apiKey is provided, validate it (external student API)
  if (apiKey) {
    const { isValid } = await validateStudentApiKey(apiKey);
    if (!isValid) {
      res.status(403).json({ error: 'Invalid or unverified API key' });
      return;
    }
  }

  if (!orderId || !paymentId || !signature) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    // Get token from config
    const token = process.env.FSOCIETY_TOKEN;

    // Verify payment with lazyjobseeker.com
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

      // Add course to enrollments
      const paymentRequest = await db.collection('payment_requests').doc(orderId).get();
      const paymentData = paymentRequest.data();

      if (paymentData) {
        await db.collection('enrollments').add({
          courseId: paymentData.planId,
          studentId: paymentData.studentId,
          enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
          progress: 0,
          paymentId,
          orderId
        });
      }
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

// Course Purchase Function (Internal website)
export const purchaseCourse = onRequest({ cors: true }, async (req: Request, res: Response) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const { userId, courseId } = req.body;

  if (!userId || !courseId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    // Get course details
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const courseData = courseDoc.data();
    if (!courseData) {
      res.status(404).json({ error: 'Course data not found' });
      return;
    }

    // Create payment request
    const paymentResponse = await fetch('https://lazyjobseeker.com/generatePaymentLink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FSOCIETY_TOKEN}`
      },
      body: JSON.stringify({
        amount: courseData.price,
        currency: 'INR',
        planId: courseId,
        planName: courseData.title,
        studentId: userId
      })
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      throw new Error(paymentData.error || 'Failed to generate payment link');
    }

    // Store payment request
    await db.collection('payment_requests').doc(paymentData.orderId).set({
      studentId: userId,
      courseId,
      planId: courseId,
      planName: courseData.title,
      amount: courseData.price,
      orderId: paymentData.orderId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      paymentUrl: paymentData.paymentUrl,
      orderDetails: paymentData
    });
  } catch (error) {
    console.error('Error purchasing course:', error);
    res.status(500).json({ error: 'Failed to purchase course' });
  }
});

// Verify Course Purchase
export const verifyCoursePurchase = onRequest({ cors: true }, async (req: Request, res: Response) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const { orderId, paymentId, signature } = req.body;

  if (!orderId || !paymentId || !signature) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    // Get token from config
    const token = process.env.FSOCIETY_TOKEN;

    const response = await fetch('https://lazyjobseeker.com/verifyPaymentStatus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderId, paymentId, signature })
    });

    const data = await response.json();

    if (data.status === 'success') {
      const purchaseQuery = await db.collection('purchases')
        .where('orderId', '==', orderId)
        .limit(1)
        .get();

      if (!purchaseQuery.empty) {
        const purchaseDoc = purchaseQuery.docs[0];
        await purchaseDoc.ref.update({
          status: 'completed',
          paymentId,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('notifications').add({
          userId: purchaseDoc.data().userId,
          type: 'course_purchase',
          title: 'Course Purchase Successful',
          message: 'You now have access to your purchased course.',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          link: `/courses/${purchaseDoc.data().courseId}`
        });
      }
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Function to update API token
export const updateApiToken = onRequest({ cors: true }, async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Check for admin authentication
  if (!req.headers.authorization) {
    res.status(401).send('Unauthorized');
    return;
  }

  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  try {
    const configRef = db.collection('config').doc('api');
    await configRef.update({
      token,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ message: 'API token updated successfully' });
  } catch (error) {
    console.error('Error updating API token:', error);
    res.status(500).json({ error: 'Failed to update API token' });
  }
}); 