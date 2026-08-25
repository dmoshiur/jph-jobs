/**
 * Firebase Admin SDK bootstrap.
 *
 * Initializes a single Firebase app used for:
 *   - Authentication (verifying client ID tokens, managing users, custom claims)
 *   - Cloud Firestore (primary datastore — replaces PostgreSQL/Prisma)
 *   - Realtime Database (live notifications / presence mirror)
 *
 * Credentials are resolved from the environment so the same code runs against a
 * real Firebase project or the local Firebase Emulator Suite. See .env.example.
 */
import { cert, getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getDatabase, type Database } from 'firebase-admin/database';
import { env } from '../config/env.js';

let app: App | undefined;

function loadServiceAccount() {
  // 1) Inline JSON (FIREBASE_SERVICE_ACCOUNT) — handy for serverless/Vercel.
  if (env.FIREBASE_SERVICE_ACCOUNT?.trim()) {
    try {
      const account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
      if (!account.project_id || !account.client_email || !account.private_key) {
        throw new Error('missing project_id, client_email or private_key');
      }
      return account;
    } catch (error) {
      const detail = error instanceof Error ? `: ${error.message}` : '';
      throw new Error(`FIREBASE_SERVICE_ACCOUNT is invalid${detail}`);
    }
  }
  // 2) Discrete fields (FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY).
  if (env.FIREBASE_PROJECT_ID?.trim() && env.FIREBASE_CLIENT_EMAIL?.trim() && env.FIREBASE_PRIVATE_KEY?.trim()) {
    return {
      projectId: env.FIREBASE_PROJECT_ID.trim(),
      clientEmail: env.FIREBASE_CLIENT_EMAIL.trim(),
      // Support escaped newlines from single-line .env values.
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }
  return null;
}

export function getFirebaseApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }

  const databaseURL = env.FIREBASE_DATABASE_URL || undefined;
  const projectId = env.FIREBASE_PROJECT_ID || undefined;
  const serviceAccount = loadServiceAccount();

  if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      databaseURL,
      projectId: projectId ?? (serviceAccount as { projectId?: string }).projectId
    });
  } else if (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST) {
    // Emulator mode: credentials are not required.
    app = initializeApp({ projectId: projectId ?? 'demo-jph-jobs', databaseURL });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Explicitly opt in to ADC (for GCP, gcloud, or a service-account file).
    // Do not silently fall back: that produces the misleading "Unable to detect a
    // Project Id" error when a developer only configured FIREBASE_DATABASE_URL.
    app = initializeApp({ credential: applicationDefault(), databaseURL, projectId });
  } else {
    throw new Error(
      'Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT or ' +
      'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in backend/.env. ' +
      'FIREBASE_DATABASE_URL alone is not an Admin SDK credential.'
    );
  }

  return app;
}

let _db: Firestore | undefined;
export function firestore(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
    try {
      _db.settings({ ignoreUndefinedProperties: true });
    } catch {
      /* settings can only be applied once */
    }
  }
  return _db;
}

export function firebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

let _rtdb: Database | undefined;
export function realtimeDb(): Database | null {
  if (!env.FIREBASE_DATABASE_URL) return null;
  if (!_rtdb) _rtdb = getDatabase(getFirebaseApp());
  return _rtdb;
}
