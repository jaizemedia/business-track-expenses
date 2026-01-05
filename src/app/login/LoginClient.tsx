'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  deleteDoc,
} from 'firebase/firestore';
import Image from 'next/image';
import { siteDetails } from '@/data/siteDetails';

/* ---------------- Firebase ---------------- */

const firebaseConfig = {
  apiKey: 'AIzaSyC9YxJHEs3QnW8mdiBY2U4uevuo9kDg-w4',
  authDomain: 'trackexpenses-c2513.firebaseapp.com',
  projectId: 'trackexpenses-c2513',
  storageBucket: 'trackexpenses-c2513.firebasestorage.app',
  messagingSenderId: '1059940742374',
  appId: '1:1059940742374:web:a0f302bbe37d5e645ef727',
  measurementId: 'G-51CGZKG1PS',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

/* ---------------- Types ---------------- */

type Role = 'admin' | 'member';

type InviteDoc = {
  email: string;
  businessId: string;
  role: Role;
};

type UserDoc = {
  businessId?: string;
};

/* ---------------- Helpers ---------------- */

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return 'Something went wrong';
}

function getAuthErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}

/* ---------------- Component ---------------- */

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = useMemo(() => searchParams.get('invite'), [searchParams]);

  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inviteId) setIsLogin(false);
  }, [inviteId]);

  /* ---------- Firestore actions ---------- */

  const createBusinessAccount = async (
    uid: string,
    emailStr: string,
    nameStr: string
  ) => {
    const businessRef = doc(collection(db, 'businesses'));
    const businessId = businessRef.id;

    await setDoc(businessRef, {
      name: businessName.trim(),
      ownerUid: uid,
      createdAt: new Date(),
    });

    await setDoc(doc(db, 'businesses', businessId, 'members', uid), {
      email: emailStr,
      name: nameStr,
      role: 'admin' as Role,
      status: 'active',
      invitedAt: new Date(),
    });

    await setDoc(doc(db, 'users', uid), {
      email: emailStr,
      name: nameStr,
      businessId,
      role: 'admin' as Role,
      createdAt: new Date(),
    });
  };

  const acceptInvite = async (
    uid: string,
    emailStr: string,
    nameStr: string,
    invId: string
  ) => {
    const inviteRef = doc(db, 'invites', invId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
      throw new Error('Invite link is invalid or expired.');
    }

    const invite = inviteSnap.data() as InviteDoc;

    if (invite.email.toLowerCase() !== emailStr.toLowerCase()) {
      throw new Error('This invite was sent to a different email.');
    }

    await setDoc(doc(db, 'businesses', invite.businessId, 'members', uid), {
      email: emailStr,
      name: nameStr,
      role: invite.role,
      status: 'active',
      invitedAt: new Date(),
    });

    await setDoc(doc(db, 'users', uid), {
      email: emailStr,
      name: nameStr,
      businessId: invite.businessId,
      role: invite.role,
      createdAt: new Date(),
    });

    await deleteDoc(inviteRef);
  };

  /* ---------- Submit ---------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    const emailStr = email.trim().toLowerCase();
    const nameStr = fullName.trim();
    const isSignup = !isLogin || !!inviteId;

    try {
      if (isSignup && !nameStr) throw new Error('Full Name is required.');

      let uid = '';

      try {
        const cred = await createUserWithEmailAndPassword(auth, emailStr, password);
        uid = cred.user.uid;
      } catch (err) {
        if (getAuthErrorCode(err) === 'auth/email-already-in-use') {
          const cred = await signInWithEmailAndPassword(auth, emailStr, password);
          uid = cred.user.uid;
        } else {
          throw err;
        }
      }

      if (inviteId) {
        await acceptInvite(uid, emailStr, nameStr, inviteId);
      } else if (isSignup) {
        await createBusinessAccount(uid, emailStr, nameStr);
      }

      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Google ---------- */

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const emailStr = (user.email || '').toLowerCase();

      if (inviteId) {
        if (!fullName.trim()) throw new Error('Full Name is required.');
        await acceptInvite(user.uid, emailStr, fullName.trim(), inviteId);
        router.push('/dashboard');
        return;
      }

      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.data() as UserDoc | undefined;

      if (data?.businessId) {
        router.push('/dashboard');
        return;
      }

      throw new Error('Switch to Sign Up to create a business.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */

  return (
    <div className="flex justify-center items-center min-h-screen px-4 relative">
      {loading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3">
            <div className="h-10 w-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold">Please wait…</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg p-8">
        <h2 className="text-3xl font-extrabold mb-4 text-center text-gray-700">
          {siteDetails.siteName}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {(!isLogin || inviteId) && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="input"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />

          {!inviteId && !isLogin && (
            <input
              type="text"
              placeholder="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="input"
            />
          )}

          <button className="btn-primary" disabled={loading}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="my-4 text-center text-sm text-gray-500">or</div>

        <button onClick={handleGoogleSignIn} className="btn-secondary">
          <Image
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            width={20}
            height={20}
          />
          Continue with Google
        </button>

        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}
