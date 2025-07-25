import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
// import { initializeApp } from 'firebase-admin/app';
import { registerStudent, updateStudentApiKey } from './student';
import { createRazorpayOrder, verifyRazorpayPayment } from './razorpay';

// Initialize Firebase Admin
// initializeApp();

export const registerStudentFunction = functions.https.onRequest((req: Request, res: Response) => {
  registerStudent(req, res);
});

export const updateStudentApiKeyFunction = functions.https.onRequest((req: Request, res: Response) => {
  updateStudentApiKey(req, res);
});

export const createRazorpayOrderFunction = functions.https.onRequest((req: Request, res: Response) => {
  createRazorpayOrder(req, res);
});

export const verifyRazorpayPaymentFunction = functions.https.onRequest((req: Request, res: Response) => {
  verifyRazorpayPayment(req, res);
}); 