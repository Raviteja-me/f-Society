const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const fetch = require('node-fetch');

admin.initializeApp();

// Helper function to handle CORS
const corsHandler = (handler) => {
  return (req, res) => {
    return cors(req, res, () => {
      // Set CORS headers
      res.set('Access-Control-Allow-Origin', 'https://fsociety.today');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Allow-Credentials', 'true');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      return handler(req, res);
    });
  };
};

// Get API Token
exports.getApiToken = corsHandler(async (req, res) => {
  try {
    // Call your backend service to get a token
    const response = await fetch('https://your-backend-service.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${functions.config().backend.api_key}`
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Generate Payment Link
exports.generatePaymentLink = corsHandler(async (req, res) => {
  try {
    const { amount, currency, planId, planName, studentId } = req.body;

    // Call your backend service to generate payment
    const response = await fetch('https://your-backend-service.com/api/payment/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${functions.config().backend.api_key}`
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
    res.json(data);
  } catch (error) {
    console.error('Error generating payment link:', error);
    res.status(500).json({ error: 'Failed to generate payment link' });
  }
});

// Verify Payment Status
exports.verifyPaymentStatus = corsHandler(async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    // Call your backend service to verify payment
    const response = await fetch('https://your-backend-service.com/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${functions.config().backend.api_key}`
      },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature
      })
    });

    const data = await response.json();

    if (data.status === 'success') {
      // Add course to user's enrollments
      await admin.firestore().collection('enrollments').add({
        courseId: data.courseId,
        studentId: data.studentId,
        enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
        progress: 0,
        paymentId: paymentId,
        orderId: orderId
      });

      res.json({ status: 'success', courseId: data.courseId });
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
}); 