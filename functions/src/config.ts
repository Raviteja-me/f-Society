import * as admin from 'firebase-admin';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize CORS middleware
export const corsMiddleware = cors({ 
  origin: ['https://fsociety.today', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Export Firestore instance
export const db = admin.firestore(); 