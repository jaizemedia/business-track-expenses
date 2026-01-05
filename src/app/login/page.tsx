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
import { getFirestore, doc, setDoc, getDoc, collection, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import { siteDetails } from '@/data/siteDetails';

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

type Role = 'admin' | 'member';

type InviteDoc = {
  email: string;
  businessId: string;
  role: Role;
  createdAt?: unknown;
};

type UserDoc = {
  businessId?: string;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'An unexpected error occurred';
}

function getAuthErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    const c = (err as { code?: unknown }).code;
    if (typeof c === 'string') return c;
  }
  return undefined;
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = useMemo(() => searchParams.get('invite'), [searchParams]);

  useEffect(() => {
    if (inviteId) setIsLogin(false);
  }, [inviteId]);

  const createBusinessAccount = async (uid: string, emailStr: string, nameStr: string) => {
    if (!nameStr.trim()) throw new Error('Full Name is required.');
    if (!businessName.trim()) throw new Error('Business Name is required.');

    const businessRef = doc(collection(db, 'businesses'));
    const businessId = businessRef.id;

    await setDoc(businessRef, {
      name: businessName.trim(),
      ownerUid: uid,
      createdAt: new Date(),
    });

    await setDoc(
      doc(db, 'businesses', businessId, 'members', uid),
      {
        email: emailStr,
        name: nameStr.trim(),
        role: 'admin' as Role,
        status: 'active',
        invitedAt: new Date(),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, 'users', uid),
      {
        email: emailStr,
        name: nameStr.trim(),
        businessId,
        role: 'admin' as Role,
        createdAt: new Date(),
      },
      { merge: true }
    );
  };

  const acceptInvite = async (uid: string, emailStr: string, nameStr: string, invId: string) => {
    try {
      if (!nameStr.trim()) throw new Error('Full Name is required.');

      const inviteRef = doc(db, 'invites', invId);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) throw new Error('Invite link is invalid or expired.');

      const invite = inviteSnap.data() as InviteDoc;

      if (invite.email?.toLowerCase() !== emailStr.toLowerCase()) {
        throw new Error('This invite was sent to a different email address.');
      }

      await setDoc(
        doc(db, 'businesses', invite.businessId, 'members', uid),
        {
          email: emailStr,
          name: nameStr.trim(),
          role: invite.role,
          status: 'active',
          invitedAt: new Date(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, 'users', uid),
        {
          email: emailStr,
          name: nameStr.trim(),
          businessId: invite.businessId,
          role: invite.role,
          createdAt: new Date(),
        },
        { merge: true }
      );

      await deleteDoc(inviteRef);
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      if (msg.toLowerCase().includes('missing or insufficient permissions')) {
        throw new Error(
          'Invite acceptance failed due to Firestore permissions. Check your Firestore rules (invites read, members/users write).'
        );
      }
      throw e;
    }
  };

  const ensureUserProfileExists = async (uid: string, emailStr: string) => {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, { email: emailStr, createdAt: new Date() }, { merge: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const isInviteFlow = !!inviteId;
    const isSignupFlow = !isLogin || isInviteFlow;

    const nameStr = fullName.trim();

    try {
      if (isSignupFlow && !nameStr) {
        throw new Error('Full Name is required.');
      }

      let uid = '';
      let emailStr = trimmedEmail;

      if (isSignupFlow) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          uid = cred.user.uid;
          emailStr = cred.user.email || trimmedEmail;
        } catch (err: unknown) {
          const code = getAuthErrorCode(err) || '';
          if (code === 'auth/email-already-in-use') {
            const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
            uid = cred.user.uid;
            emailStr = cred.user.email || trimmedEmail;
          } else {
            throw err;
          }
        }

        if (isInviteFlow) {
          await acceptInvite(uid, emailStr, nameStr, inviteId!);
        } else {
          await createBusinessAccount(uid, emailStr, nameStr);
        }
      } else {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        await ensureUserProfileExists(cred.user.uid, cred.user.email || trimmedEmail);
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const emailStr = (user.email || '').toLowerCase();

      if (inviteId) {
        if (!fullName.trim()) {
          throw new Error('Please enter your Full Name before continuing with Google (invite sign-up).');
        }
        await acceptInvite(user.uid, emailStr, fullName.trim(), inviteId);
        router.push('/dashboard');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const data = snap.data() as UserDoc | undefined;

      if (snap.exists() && data?.businessId) {
        router.push('/dashboard');
        return;
      }

      throw new Error(
        'To create a new business with Google, switch to Sign Up and enter your Full Name + Business Name first.'
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isInvite = !!inviteId;

  return (
    <div className="flex justify-center items-center min-h-screen px-4 relative">
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin" />
            <p className="text-sm text-gray-700 font-semibold">Please wait…</p>
          </div>
        </div>
      )}

      <br />
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg p-8 sm:p-10 transition-transform hover:scale-105 duration-300">
        <h2 className="text-3xl font-extrabold mb-4 text-center text-gray-700">{siteDetails.siteName}</h2>

        <p className="text-center text-gray-500 mb-6 text-sm">
          {isInvite
            ? 'You’ve been invited — create your account to join the business.'
            : isLogin
              ? 'Welcome back! Please login.'
              : 'Create your business account'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-4">
          {/* Full Name on any sign-up (normal or invite) */}
          {(!isLogin || isInvite) && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />

          {/* Business Name only when signing up WITHOUT invite */}
          {!isSignupFlowBlockedByInvite(inviteId) && !isLogin && !isInvite && (
            <input
              type="text"
              placeholder="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-2 font-semibold rounded-xl shadow-md transition ${
              loading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="mx-4 text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={`w-full py-3 px-4 flex items-center justify-center gap-3 border rounded-xl transition ${
            loading
              ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-70'
              : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
          }`}
        >
          <Image
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            width={20}
            height={20}
            className="w-5 h-5"
            unoptimized
          />
          <span className="font-semibold text-gray-700">Continue with Google</span>
        </button>

        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-6 w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
          disabled={!!inviteId || loading}
        >
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </button>

        {!!inviteId && (
          <p className="text-xs text-gray-500 mt-3 text-center">Invite sign-up is enabled, so login toggle is disabled.</p>
        )}
      </div>
    </div>
  );
};

function isSignupFlowBlockedByInvite(inviteId: string | null) {
  return !!inviteId;
}

export default AuthPage;
