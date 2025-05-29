import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import fetch from 'node-fetch';
import cors from 'cors';

admin.initializeApp();
const db = admin.firestore();

// Initialize CORS middleware
const corsHandler = cors({ origin: true });

// Initialize API token in Firestore
async function initializeApiToken() {
  const configRef = db.collection('config').doc('api');
  const configDoc = await configRef.get();

  if (!configDoc.exists) {
    await configRef.set({
      token: '918f67462af220b73ed459ef56e3bc29b7c68cbce79766a71c55a9c25bde9d6a',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('API token initialized in Firestore');
  }
}

// Call initialization when the function is deployed
initializeApiToken().catch(console.error);

// Helper function to get API token
async function getApiToken() {
  const configDoc = await db.collection('config').doc('api').get();
  if (!configDoc.exists) {
    throw new Error('API configuration not found');
  }
  return configDoc.data()?.token;
}

// 1. Register Student
export const registerStudent = functions.https.onRequest(async (req, res) => {
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

// 2. Create Payment Request
export const createPaymentRequest = functions.https.onRequest(async (req, res) => {
  const { apiKey, amount, currency, planId, planName } = req.body;

  const snap = await db.collection('students').where('apiKey', '==', apiKey).limit(1).get();
  if (snap.empty) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  const student = snap.docs[0];
  const studentId = student.id;

  if (student.data().status !== 'verified') {
    res.status(403).json({ error: 'Student not verified' });
    return;
  }

  try {
    const token = await getApiToken();

    const response = await fetch('https://generatepaymentlink-net74gl7ba-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, currency, planId, planName, studentId })
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(500).json({ error: 'Link generation failed', detail: data });
      return;
    }

    await db.collection('payment_requests').doc(data.orderId).set({
      studentId,
      planId,
      planName,
      amount,
      orderId: data.orderId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ 
      paymentUrl: `https://checkout.razorpay.com/v1/checkout.js`, 
      orderDetails: data 
    });
  } catch (err) {
    console.error('Failed to create payment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Verify Payment Request
export const verifyPaymentRequest = functions.https.onRequest(async (req, res) => {
  const { apiKey, orderId, paymentId, signature } = req.body;

  const snap = await db.collection('students').where('apiKey', '==', apiKey).limit(1).get();
  if (snap.empty) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  try {
    const token = await getApiToken();
    const response = await fetch('https://verifypaymentstatus-net74gl7ba-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId, paymentId, signature })
    });

    const data = await response.json();

    if (data.status === 'success') {
      await db.collection('payment_requests').doc(orderId).update({
        status: 'success',
        paymentId,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('payment_requests').doc(orderId).update({
        status: 'failed',
        reason: data.reason || 'Invalid signature',
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Course Purchase Function
export const purchaseCourse = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    try {
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

      const token = await getApiToken();

      const response = await fetch('https://generatepaymentlink-net74gl7ba-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: courseData.price,
          currency: 'INR',
          planId: courseId,
          planName: courseData.title
        })
      });

      const data = await response.json();

      if (!response.ok) {
        res.status(500).json({ error: 'Payment link generation failed', detail: data });
        return;
      }

      await db.collection('purchases').doc(`${userId}_${courseId}`).set({
        userId,
        courseId,
        status: 'pending',
        orderId: data.orderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({ 
        paymentUrl: data.paymentUrl,
        orderDetails: data
      });
    } catch (error) {
      console.error('Error processing course purchase:', error);
      res.status(500).json({ error: 'Failed to process purchase' });
    }
  });
});

// Verify Course Purchase
export const verifyCoursePurchase = functions.https.onRequest(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  try {
    const token = await getApiToken();
    const response = await fetch('https://verifypaymentstatus-net74gl7ba-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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
export const updateApiToken = functions.https.onRequest(async (req, res) => {
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