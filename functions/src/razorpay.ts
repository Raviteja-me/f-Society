import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import * as functions from 'firebase-functions';

const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret
});

// Create Razorpay Order
export const createRazorpayOrder = onRequest({ cors: true }, async (req, res) => {
  try {
    const { amount, currency = 'INR', courseId, studentId } = req.body;

    if (!amount || !courseId || !studentId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Create order in Razorpay
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `course_${courseId}_${studentId}`,
      notes: {
        courseId,
        studentId
      }
    });

    // Store order details in Firestore
    await admin.firestore().collection('orders').doc(order.id).set({
      courseId,
      studentId,
      amount,
      currency,
      status: 'created',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify Payment
export const verifyRazorpayPayment = onRequest({ cors: true }, async (req, res) => {
  try {
    const { orderId, paymentId, signature, courseId, studentId } = req.body;

    if (!orderId || !paymentId || !signature || !courseId || !studentId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Verify signature
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', functions.config().razorpay.key_secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    // Update order status
    await admin.firestore().collection('orders').doc(orderId).update({
      status: 'completed',
      paymentId,
      signature,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Add course to user's enrollments
    await admin.firestore().collection('enrollments').add({
      courseId,
      studentId,
      orderId,
      paymentId,
      enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
      progress: 0
    });

    res.json({ 
      status: 'success',
      message: 'Payment verified and course enrolled'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
}); 