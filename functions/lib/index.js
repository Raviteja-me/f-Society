"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePaymentLink = exports.updateApiToken = exports.verifyCoursePurchase = exports.purchaseCourse = exports.verifyPaymentStatus = exports.createPaymentRequest = exports.registerStudent = exports.getApiToken = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const cors_1 = __importDefault(require("cors"));
admin.initializeApp();
const db = admin.firestore();
// Initialize CORS middleware
const corsMiddleware = (0, cors_1.default)({
    origin: ['https://fsociety.today', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
});
// Helper function to handle CORS
const corsHandler = (req, res, handler) => {
    corsMiddleware(req, res, () => {
        handler().catch(error => {
            console.error('Error in handler:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
    });
};
// Helper function to validate token
function validateToken(req) {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    return token === process.env.FSOCIETY_TOKEN;
}
// Helper function to validate student API key
function validateStudentApiKey(apiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const studentQuery = yield db.collection('students')
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
        }
        catch (error) {
            console.error('Error validating student API key:', error);
            return { isValid: false };
        }
    });
}
// Get API Token
exports.getApiToken = (0, https_1.onRequest)({ cors: true }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    res.json({ token: process.env.FSOCIETY_TOKEN });
}));
// Register Student
exports.registerStudent = (0, https_1.onRequest)({ cors: true }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const { userId, name, email, pan, upi, aadhaar, bankDetails, documents } = req.body;
    if (!userId || !name || !email || !pan || !upi || !aadhaar || !bankDetails || !documents) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    try {
        const userDoc = yield db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const existingStudent = yield db.collection('students')
            .where('userId', '==', userId)
            .limit(1)
            .get();
        if (!existingStudent.empty) {
            res.status(400).json({ error: 'User is already registered as a student' });
            return;
        }
        const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex');
        const studentRef = yield db.collection('students').add({
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
        yield db.collection('notifications').add({
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
    }
    catch (error) {
        console.error('Error registering student:', error);
        res.status(500).json({ error: 'Failed to register student' });
    }
}));
// Create Payment Request
exports.createPaymentRequest = (0, https_1.onRequest)({ cors: true }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    const { apiKey, amount, currency, planId, planName, studentId: providedStudentId } = req.body;
    let finalStudentId = providedStudentId;
    // If apiKey is provided, validate it (external student API)
    if (apiKey) {
        const { isValid, studentId: validatedStudentId } = yield validateStudentApiKey(apiKey);
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
        const response = yield (0, node_fetch_1.default)('https://lazyjobseeker.com/generatePaymentLink', {
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
        const data = yield response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate payment link');
        }
        // Store payment request
        yield db.collection('payment_requests').doc(data.orderId).set({
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
    }
    catch (error) {
        console.error('Error creating payment request:', error);
        res.status(500).json({ error: 'Failed to create payment request' });
    }
}));
// Verify Payment Status
exports.verifyPaymentStatus = (0, https_1.onRequest)({ cors: true }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    const { apiKey, orderId, paymentId, signature } = req.body;
    // If apiKey is provided, validate it (external student API)
    if (apiKey) {
        const { isValid } = yield validateStudentApiKey(apiKey);
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
        const response = yield (0, node_fetch_1.default)('https://lazyjobseeker.com/verifyPaymentStatus', {
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
        const data = yield response.json();
        if (data.status === 'success') {
            // Update payment request status
            yield db.collection('payment_requests').doc(orderId).update({
                status: 'success',
                paymentId,
                verifiedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Add course to enrollments
            const paymentRequest = yield db.collection('payment_requests').doc(orderId).get();
            const paymentData = paymentRequest.data();
            if (paymentData) {
                yield db.collection('enrollments').add({
                    courseId: paymentData.planId,
                    studentId: paymentData.studentId,
                    enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
                    progress: 0,
                    paymentId,
                    orderId
                });
            }
        }
        else {
            yield db.collection('payment_requests').doc(orderId).update({
                status: 'failed',
                reason: data.reason || 'Payment verification failed',
                verifiedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        res.json(data);
    }
    catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
}));
// Course Purchase Function (Internal website)
exports.purchaseCourse = (0, https_1.onRequest)({ cors: true }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const courseDoc = yield db.collection('courses').doc(courseId).get();
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
        const paymentResponse = yield (0, node_fetch_1.default)('https://lazyjobseeker.com/generatePaymentLink', {
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
        const paymentData = yield paymentResponse.json();
        if (!paymentResponse.ok) {
            throw new Error(paymentData.error || 'Failed to generate payment link');
        }
        // Store payment request
        yield db.collection('payment_requests').doc(paymentData.orderId).set({
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
    }
    catch (error) {
        console.error('Error purchasing course:', error);
        res.status(500).json({ error: 'Failed to purchase course' });
    }
}));
// Verify Course Purchase
exports.verifyCoursePurchase = (0, https_1.onRequest)({ cors: true }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const response = yield (0, node_fetch_1.default)('https://lazyjobseeker.com/verifyPaymentStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderId, paymentId, signature })
        });
        const data = yield response.json();
        if (data.status === 'success') {
            const purchaseQuery = yield db.collection('purchases')
                .where('orderId', '==', orderId)
                .limit(1)
                .get();
            if (!purchaseQuery.empty) {
                const purchaseDoc = purchaseQuery.docs[0];
                yield purchaseDoc.ref.update({
                    status: 'completed',
                    paymentId,
                    verifiedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                yield db.collection('notifications').add({
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
    }
    catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ error: 'Verification failed' });
    }
}));
// Function to update API token
exports.updateApiToken = (0, https_1.onRequest)({ cors: true }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield configRef.update({
            token,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).json({ message: 'API token updated successfully' });
    }
    catch (error) {
        console.error('Error updating API token:', error);
        res.status(500).json({ error: 'Failed to update API token' });
    }
}));
// Generate Payment Link
exports.generatePaymentLink = (0, https_1.onRequest)({ cors: true }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        // Log the incoming request
        console.log('Received payment link request:', {
            headers: req.headers,
            body: req.body
        });
        const { amount, currency, planId, planName, studentId } = req.body;
        // Validate required fields
        if (!amount || !currency || !planId || !planName || !studentId) {
            console.error('Missing required fields:', { amount, currency, planId, planName, studentId });
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        // Get token from config
        const token = process.env.FSOCIETY_TOKEN;
        if (!token) {
            console.error('FSOCIETY_TOKEN not configured');
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }
        // Call lazyjobseeker.com to generate payment
        const response = yield (0, node_fetch_1.default)('https://lazyjobseeker.com/generatePaymentLink', {
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
        // Log the response
        console.log('Payment link response status:', response.status);
        const data = yield response.json();
        console.log('Payment link response data:', data);
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate payment link');
        }
        // Store payment request
        yield db.collection('payment_requests').doc(data.orderId).set({
            studentId,
            planId,
            planName,
            amount,
            orderId: data.orderId,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Return the exact response from lazyjobseeker.com
        res.json(data);
    }
    catch (error) {
        console.error('Error generating payment link:', error);
        res.status(500).json({
            error: 'Failed to generate payment link',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
