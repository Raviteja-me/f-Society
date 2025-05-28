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
exports.verifyPaymentRequest = exports.createPaymentRequest = exports.registerStudent = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const node_fetch_1 = __importDefault(require("node-fetch"));
admin.initializeApp();
const db = admin.firestore();
// 1. Register Student
exports.registerStudent = functions.https.onRequest((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const { name, email, pan, upi } = req.body;
    if (!name || !email || !pan || !upi) {
        res.status(400).json({ error: 'Missing fields' });
        return;
    }
    const apiKey = 'sk_' + crypto.randomBytes(24).toString('hex');
    const studentRef = yield db.collection('students').add({
        name, email, pan, upi, apiKey,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(200).json({ apiKey, studentId: studentRef.id });
}));
// 2. Create Payment Request
exports.createPaymentRequest = functions.https.onRequest((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { apiKey, amount, currency, planId, planName } = req.body;
    // Validate API Key
    const snap = yield db.collection('students').where('apiKey', '==', apiKey).limit(1).get();
    if (snap.empty) {
        res.status(403).json({ error: 'Invalid API key' });
        return;
    }
    const student = snap.docs[0];
    const studentId = student.id;
    try {
        const response = yield (0, node_fetch_1.default)('https://generatepaymentlink-net74gl7ba-uc.a.run.app', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer YOUR_FSOCIETY_TOKEN`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, currency, planId, planName, studentId })
        });
        const data = yield response.json();
        if (!response.ok) {
            res.status(500).json({ error: 'Link generation failed', detail: data });
            return;
        }
        // Store in Firestore
        yield db.collection('payment_requests').doc(data.orderId).set({
            studentId,
            planId,
            planName,
            amount,
            orderId: data.orderId,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).json({ paymentUrl: `https://checkout.razorpay.com/v1/checkout.js`, orderDetails: data });
    }
    catch (err) {
        console.error('Failed to create payment:', err);
        res.status(500).json({ error: 'Server error' });
    }
}));
// 3. Verify Payment Request
exports.verifyPaymentRequest = functions.https.onRequest((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { apiKey, orderId, paymentId, signature } = req.body;
    // Validate API Key
    const snap = yield db.collection('students').where('apiKey', '==', apiKey).limit(1).get();
    if (snap.empty) {
        res.status(403).json({ error: 'Invalid API key' });
        return;
    }
    const student = snap.docs[0];
    try {
        const response = yield (0, node_fetch_1.default)('https://verifypaymentstatus-net74gl7ba-uc.a.run.app', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer YOUR_FSOCIETY_TOKEN`,
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
