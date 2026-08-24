'use client';

/**
 * Firebase Web SDK bootstrap (client-side).
 *
 * Provides Authentication (email/password + Google) and the Realtime Database
 * used for live notifications. All configuration comes from NEXT_PUBLIC_FIREBASE_*
 * environment variables so no secrets are embedded in the bundle.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

let app: FirebaseApp | undefined;
export function firebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.');
  }
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

let _auth: Auth | undefined;
export function firebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(firebaseApp());
  return _auth;
}

export const googleProvider = new GoogleAuthProvider();

let _db: Database | undefined;
export function realtimeDb(): Database | null {
  if (!firebaseConfig.databaseURL) return null;
  if (!_db) _db = getDatabase(firebaseApp());
  return _db;
}
