'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { api, ApiError } from '@/services/api';
import { firebaseAuth, googleProvider, isFirebaseConfigured } from '@/services/firebase';
import type { CurrentUser } from '@/types/api';

interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  accountType: 'candidate' | 'employer' | 'shop-owner';
}

interface AuthContextValue {
  user?: CurrentUser;
  loading: boolean;
  firebaseReady: boolean;
  login(email: string, password: string): Promise<void>;
  loginWithGoogle(): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  refresh(): Promise<void>;
  hasPermission(permission: string): boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function friendly(err: unknown): Error {
  if (err instanceof ApiError) return new Error(err.message);
  const code = (err as { code?: string })?.code;
  const map: Record<string, string> = {
    'auth/invalid-credential': 'ইমেইল বা পাসওয়ার্ড ভুল',
    'auth/invalid-email': 'ইমেইল সঠিক নয়',
    'auth/user-not-found': 'অ্যাকাউন্ট পাওয়া যায়নি',
    'auth/wrong-password': 'পাসওয়ার্ড ভুল',
    'auth/email-already-in-use': 'এই ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে',
    'auth/weak-password': 'পাসওয়ার্ড দুর্বল (কমপক্ষে ৮ অক্ষর)',
    'auth/popup-closed-by-user': 'গুগল সাইন-ইন বাতিল করা হয়েছে',
    'auth/too-many-requests': 'অনেকবার চেষ্টা হয়েছে, একটু পরে চেষ্টা করুন'
  };
  if (code && map[code]) return new Error(map[code]);
  return err instanceof Error ? err : new Error('একটি ত্রুটি ঘটেছে');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | undefined>();
  const [loading, setLoading] = useState(true);
  const firebaseReady = isFirebaseConfigured();

  const loadMe = useCallback(async () => {
    try {
      const data = await api.get<{ user: CurrentUser }>('/auth/me');
      setUser(data.user);
    } catch {
      setUser(undefined);
    }
  }, []);

  // React to Firebase auth-state / token changes.
  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    const unsub = onIdTokenChanged(firebaseAuth(), async (fbUser: FirebaseUser | null) => {
      if (fbUser) await loadMe();
      else setUser(undefined);
      setLoading(false);
    });
    return () => unsub();
  }, [firebaseReady, loadMe]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    firebaseReady,
    async login(email, password) {
      try {
        await signInWithEmailAndPassword(firebaseAuth(), email, password);
        await api.post('/auth/session'); // records last-login, ensures provisioning
        await loadMe();
      } catch (err) { throw friendly(err); }
    },
    async loginWithGoogle() {
      try {
        await signInWithPopup(firebaseAuth(), googleProvider);
        await api.post('/auth/session');
        await loadMe();
      } catch (err) { throw friendly(err); }
    },
    async register(input) {
      try {
        // Create the account server-side so the correct RBAC role is assigned,
        // then sign the user in on the client to obtain an ID token.
        await api.post('/auth/register', input);
        const cred = await signInWithEmailAndPassword(firebaseAuth(), input.email, input.password);
        if (input.name) await updateProfile(cred.user, { displayName: input.name }).catch(() => undefined);
        await api.post('/auth/session');
        await loadMe();
      } catch (err) { throw friendly(err); }
    },
    async logout() {
      try { await signOut(firebaseAuth()); } catch { /* ignore */ }
      setUser(undefined);
    },
    async forgotPassword(email) {
      // Send the reset email directly via Firebase (fast) and notify the backend.
      try { await sendPasswordResetEmail(firebaseAuth(), email); } catch { /* ignore */ }
      await api.post('/auth/forgot-password', { email }).catch(() => undefined);
    },
    refresh: loadMe,
    hasPermission(permission) {
      return Boolean(user?.roles.includes('root-admin') || user?.permissions.includes(permission));
    }
  }), [firebaseReady, loadMe, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
