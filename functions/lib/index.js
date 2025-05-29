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
exports.updateApiToken = exports.verifyCoursePurchase = exports.purchaseCourse = exports.verifyPaymentRequest = exports.createPaymentRequest = exports.registerStudent = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const node_fetch_1 = __importDefault(require("node-fetch"));
admin.initializeApp();
const db = admin.firestore();
// Initialize API token in Firestore
function initializeApiToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const configRef = db.collection('config').doc('api');
        const configDoc = yield configRef.get();
        if (!configDoc.exists) {
            yield configRef.set({
                token: '918f67462af220b73ed459ef56e3bc29b7c68cbce79766a71c55a9c25bde9d6a',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('API token initialized in Firestore');
        }
    });
}
// Call initialization when the function is deployed
initializeApiToken().catch(console.error);
// Helper function to get API token
function getApiToken() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const configDoc = yield db.collection('config').doc('api').get();
        if (!configDoc.exists) {
            throw new Error('API configuration not found');
        }
        return (_a = configDoc.data()) === null || _a === void 0 ? void 0 : _a.token;
    });
}
// 1. Register Student
exports.registerStudent = functions.https.onRequest((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
// 2. Create Payment Request
exports.createPaymentRequest = functions.https.onRequest((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { apiKey, amount, currency, planId, planName } = req.body;
    const snap = yield db.collection('students').where('apiKey', '==', apiKey).limit(1).get();
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
        const token = yield getApiToken();
        const response = yield (0, node_fetch_1.default)('https://generatepaymentlink-net74gl7ba-uc.a.run.app', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, currency, planId, planName, studentId })
        });
        const data = yield response.json();
        if (!response.ok) {
            res.status(500).json({ error: 'Link generation failed', detail: data });
            return;
        }
        yield db.collection('payment_requests').doc(data.orderId).set({
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
    }
    catch (err) {
        console.error('Failed to create payment:', err);
        res.status(500).json({ error: 'Server error' });
    }
}));
// 3. Verify Payment Request
exports.verifyPaymentRequest = functions.https.onRequest((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { apiKey, orderId, paymentId, signature } = req.body;
    const snap = yield db.collection('students').where('apiKey', '==', apiKey).limit(1).get();
    if (snap.empty) {
        res.status(403).json({ error: 'Invalid API key' });
        return;
    }
    try {
        const token = yield getApiToken();
        const response = yield (0, node_fetch_1.default)('https://verifypaymentstatus-net74gl7ba-uc.a.run.app', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderId, paymentId, signature })
        });
        const data = yield response.json();
        if (data.status === 'success') {
            yield db.collection('payment_requests').doc(orderId).update({
                status: 'success',
                paymentId,
                verifiedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        else {
            yield db.collection('payment_requests').doc(orderId).update({
                status: 'failed',
                reason: data.reason || 'Invalid signature',
                verifiedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        res.status(200).json(data);
    }
    catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ error: 'Verification failed' });
    }
}));
// Course Purchase Function
exports.purchaseCourse = functions.https.onRequest((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const token = yield getApiToken();
        const response = yield (0, node_fetch_1.default)('https://generatepaymentlink-net74gl7ba-uc.a.run.app', {
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
        const data = yield response.json();
        if (!response.ok) {
            res.status(500).json({ error: 'Payment link generation failed', detail: data });
            return;
        }
        yield db.collection('purchases').doc(`${userId}_${courseId}`).set({
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
    }
    catch (error) {
        console.error('Error processing course purchase:', error);
        res.status(500).json({ error: 'Failed to process purchase' });
    }
}));
// Verify Course Purchase
exports.verifyCoursePurchase = functions.https.onRequest((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, paymentId, signature } = req.body;
    try {
        const token = yield getApiToken();
        const response = yield (0, node_fetch_1.default)('https://verifypaymentstatus-net74gl7ba-uc.a.run.app', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
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
exports.updateApiToken = functions.https.onRequest((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
