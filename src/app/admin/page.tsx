'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
} from 'firebase/firestore';

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

type Role = 'admin' | 'member';

type Tx = {
  id: string;
  date: string;
  description: string;
  amount: number;
  receiptUrl?: string;
  createdByUid?: string;
  createdByName?: string;
};

type Member = {
  id: string; // uid
  email: string;
  name?: string;
  role: Role;
  status?: 'active' | 'pending';
  invitedAt?: unknown;
};

type UserProfile = {
  businessId?: string;
  role?: Role;
};

type BusinessDoc = {
  name?: string;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return 'An unexpected error occurred';
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [businessId, setBusinessId] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [activeTab, setActiveTab] = useState<'transactions' | 'team' | 'invites'>('transactions');

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [balance, setBalance] = useState(0);

  const [modalImage, setModalImage] = useState<string | null>(null);

  // Invite UI
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [createdInviteLink, setCreatedInviteLink] = useState('');
  const baseUrl = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), []);

  // Loading
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        setError(null);
        setLoading(true);

        if (!u) {
          window.location.href = '/login';
          return;
        }
        setUser(u);

        // Load user profile -> businessId + role
        const userSnap = await getDoc(doc(db, 'users', u.uid));
        const userData = userSnap.data() as UserProfile | undefined;

        if (!userData?.businessId) {
          window.location.href = '/dashboard';
          return;
        }

        if (userData.role !== 'admin') {
          window.location.href = '/dashboard';
          return;
        }

        setBusinessId(userData.businessId);

        // Load business name
        const bizSnap = await getDoc(doc(db, 'businesses', userData.businessId));
        const bizData = bizSnap.data() as BusinessDoc | undefined;
        setBusinessName(bizData?.name || 'Business');

        await Promise.all([loadTransactions(userData.businessId), loadMembers(userData.businessId)]);
      } catch (e: unknown) {
        setError(getErrorMessage(e) || 'Failed to load admin panel.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const loadTransactions = async (bid: string) => {
    const snap = await getDocs(collection(db, 'businesses', bid, 'transactions'));

    const list: Tx[] = [];
    let total = 0;

    snap.forEach((d) => {
      const data = d.data() as Omit<Tx, 'id'>;
      list.push({ id: d.id, ...data });
      total += Number(data.amount) || 0;
    });

    list.reverse();
    setTransactions(list);
    setBalance(total);
  };

  const loadMembers = async (bid: string) => {
    const snap = await getDocs(collection(db, 'businesses', bid, 'members'));

    const list: Member[] = [];
    snap.forEach((d) => {
      const data = d.data() as Omit<Member, 'id'>;
      list.push({ id: d.id, ...data });
    });

    setMembers(list);
  };

  const createInvite = async () => {
    if (!businessId || busy) return;

    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    try {
      setBusy(true);
      setError(null);

      const inviteRef = await addDoc(collection(db, 'invites'), {
        email,
        businessId,
        role: inviteRole,
        createdAt: new Date(),
        createdBy: user?.uid || null,
      });

      const link = `${baseUrl}/login?invite=${inviteRef.id}`;
      setCreatedInviteLink(link);
      setInviteEmail('');
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Failed to create invite.');
    } finally {
      setBusy(false);
    }
  };

  const copyInviteLink = async () => {
    if (!createdInviteLink) return;
    await navigator.clipboard.writeText(createdInviteLink);
    alert('Invite link copied!');
  };

  const openModal = (src: string) => setModalImage(src);
  const closeModal = () => setModalImage(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin" />
          <p className="text-sm text-gray-700 font-semibold">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans">
      <br />
      <br />

      {/* Header */}
      <div className="w-full max-w-6xl p-4 mb-4 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>

        <p className="text-gray-600">
          {businessName} • {user.email}{' '}
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">ADMIN</span>
        </p>

        {/* ✅ Use balance so it’s not an unused var */}
        <p className={`mt-2 text-xl font-semibold ${balance < 5 ? 'text-red-600' : ''}`}>
          Business Balance: £{balance.toFixed(2)}
        </p>

        <div className="mt-3">
          <a className="text-blue-600 hover:underline text-sm" href="/dashboard">
            Back to Dashboard
          </a>
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      {/* Tabs */}
      <div className="w-full max-w-6xl flex mb-4">
        {(['transactions', 'team', 'invites'] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 p-3 rounded-t-lg font-semibold transition ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab(tab)}
            disabled={busy}
          >
            {tab === 'transactions' && 'All Transactions'}
            {tab === 'team' && 'Team Members'}
            {tab === 'invites' && 'Invite Members'}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl bg-white rounded-b-lg p-6 shadow-md">
        {/* TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">All Transactions</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-lg">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-3 py-2">Date</th>
                    <th className="border px-3 py-2">Description</th>
                    <th className="border px-3 py-2">Amount (£)</th>
                    <th className="border px-3 py-2">Made By</th>
                    <th className="border px-3 py-2">Receipt</th>
                    <th className="border px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-gray-500">
                        No transactions yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2">{tx.date}</td>
                        <td className="border px-3 py-2">{tx.description}</td>
                        <td className={`border px-3 py-2 ${tx.amount < 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {Number(tx.amount).toFixed(2)}
                        </td>
                        <td className="border px-3 py-2">{tx.createdByName || '—'}</td>
                        <td className="border px-3 py-2">
                          {tx.receiptUrl ? (
                            <button
                              className="text-blue-500 hover:underline"
                              onClick={() => openModal(tx.receiptUrl!)}
                              disabled={busy}
                            >
                              View Image
                            </button>
                          ) : (
                            'No Receipt'
                          )}
                        </td>

                        {/* ✅ FIX: only ONE <td> (no nesting) and no delete button on admin */}
                        <td className="border px-3 py-2">
                          <span className="text-gray-400 text-sm">—</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="mt-4">
                <button
                  disabled={busy}
                  className={`text-sm hover:underline ${busy ? 'text-gray-400' : 'text-blue-600'}`}
                  onClick={() => businessId && loadTransactions(businessId)}
                >
                  Refresh transactions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TEAM */}
        {activeTab === 'team' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Team Members</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-lg">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-3 py-2">Name</th>
                    <th className="border px-3 py-2">Email</th>
                    <th className="border px-3 py-2">Role</th>
                    <th className="border px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4 text-gray-500">
                        No members found.
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2">{m.name || '—'}</td>
                        <td className="border px-3 py-2">{m.email}</td>
                        <td className="border px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              m.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {m.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="border px-3 py-2">{m.status || 'active'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="mt-4">
                <button
                  disabled={busy}
                  className={`text-sm hover:underline ${busy ? 'text-gray-400' : 'text-blue-600'}`}
                  onClick={() => businessId && loadMembers(businessId)}
                >
                  Refresh members
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INVITES */}
        {activeTab === 'invites' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Invite a Team Member</h2>

            <div className="flex flex-col gap-3 max-w-xl">
              <input
                type="email"
                placeholder="Team member email"
                className="p-3 rounded border border-gray-300"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={busy}
              />

              <select
                className="p-3 rounded border border-gray-300"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                disabled={busy}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>

              <button
                disabled={busy}
                className={`p-3 rounded transition ${
                  busy ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={createInvite}
              >
                {busy ? 'Creating…' : 'Create Invite Link'}
              </button>

              {createdInviteLink && (
                <div className="mt-2 p-3 border rounded bg-gray-50">
                  <p className="text-sm text-gray-700 mb-2">Invite link (send this to them):</p>
                  <div className="flex gap-2">
                    <input className="flex-1 p-2 border rounded text-sm" value={createdInviteLink} readOnly />
                    <button
                      className="bg-gray-800 text-white px-4 rounded hover:bg-black transition"
                      onClick={copyInviteLink}
                      disabled={busy}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    They’ll open the link and create their login, then they’ll automatically join your business.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Receipt modal */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            {/* ✅ next/image to avoid lint warning */}
            <Image
              src={modalImage}
              alt="Receipt"
              width={1400}
              height={1400}
              className="max-h-[90vh] max-w-[90vw] w-auto h-auto cursor-zoom-out"
              onClick={(e) => e.stopPropagation()}
              unoptimized
            />
            <button
              className="absolute top-2 right-2 text-white text-3xl font-bold"
              onClick={closeModal}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
