declare module 'firebase/app';
declare module 'firebase/firestore';
declare module 'firebase/auth';
declare module 'firebase/storage';

import { Firestore } from 'firebase/firestore';
import { Storage } from 'firebase/storage';
import { Auth } from 'firebase/auth';

declare module '../firebase' {
  export const db: Firestore;
  export const storage: Storage;
  export const auth: Auth;
} 