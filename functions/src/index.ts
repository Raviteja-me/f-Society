import * as functions from 'firebase-functions';
// import { initializeApp } from 'firebase-admin/app';
import { registerStudent, updateStudentApiKey } from './student';
import { createRazorpayOrder, verifyRazorpayPayment } from './razorpay';

// Initialize Firebase Admin
// initializeApp();

export const registerStudentFunction = functions.https.onRequest({
  memory: '256MiB',
  region: 'asia-south1'
}, (req, res) => {
  registerStudent(req, res);
});

export const updateStudentApiKeyFunction = functions.https.onRequest({
  memory: '256MiB',
  region: 'asia-south1'
}, (req, res) => {
  updateStudentApiKey(req, res);
});

export const createRazorpayOrderFunction = functions.https.onRequest({
  memory: '256MiB',
  region: 'asia-south1'
}, (req, res) => {
  createRazorpayOrder(req, res);
});

export const verifyRazorpayPaymentFunction = functions.https.onRequest({
  memory: '256MiB',
  region: 'asia-south1'
}, (req, res) => {
  verifyRazorpayPayment(req, res);
}); 