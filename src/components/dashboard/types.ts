export interface Student {
  id: string;
  name: string;
  email: string;
  pan: string;
  upi: string;
  aadhaar: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  documents: {
    panImage: string;
    aadhaarFront: string;
    aadhaarBack: string;
  };
  status: 'pending' | 'verified' | 'rejected';
  registrationDate: Date;
}

export interface PaymentRequest {
  id: string;
  studentId: string;
  studentEmail: string;
  planId: string;
  planName: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
  verifiedAt?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  timestamp: Date;
  media: Array<{
    url: string;
    type: string;
    filename: string;
  }>;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  category: 'web' | 'mobile' | 'mind';
  level: 'frontend' | 'fullstack';
  image: string;
}

export type DashboardTab = 'students' | 'payments' | 'users' | 'posts' | 'courses'; 