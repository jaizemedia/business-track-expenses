'use client';

import React, { useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
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

// ✅ Prevent re-init during Next hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

type Role = 'admin' | 'member';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  receiptUrl?: string;

  // ✅ who made it
  createdByUid?: string;
  createdByName?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  const [businessId, setBusinessId] = useState<string>('');
  const [role, setRole] = useState<Role>('member');
  const [myName, setMyName] = useState<string>('');

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'log'>('deposit');

  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [modalImage, setModalImage] = useState<string | null>(null);

  // ✅ Loading states
  const [loading, setLoading] = useState(true); // page loading (auth + firestore)
  const [busy, setBusy] = useState(false); // action loading (deposit/withdraw/delete)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        setLoading(true);

        if (!u) {
          window.location.href = '/login';
          return;
        }

        setUser(u);

        // Load user profile -> businessId + role + name
        const userSnap = await getDoc(doc(db, 'users', u.uid));
        const userData = userSnap.data() as { businessId?: string; role?: Role; name?: string } | undefined;

        if (!userData?.businessId) {
          alert(
            "Your account isn't linked to a business yet. Please sign up again as a business owner or ask an admin for an invite."
          );
          window.location.href = '/login';
          return;
        }

        setBusinessId(userData.businessId);
        setRole(userData.role || 'member');
        setMyName(userData.name || u.email || 'Unknown');

        await loadTransactions(userData.businessId);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadTransactions = async (bid: string) => {
    const colRef = collection(db, 'businesses', bid, 'transactions');
    const snapshot = await getDocs(colRef);

    const txs: Transaction[] = [];
    let total = 0;

    snapshot.forEach((d) => {
      const data = d.data() as Omit<Transaction, 'id'>;
      txs.push({ id: d.id, ...data });
      total += Number(data.amount) || 0;
    });

    txs.reverse();
    setTransactions(txs);
    setBalance(total);
  };

  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    const url = 'https://api.cloudinary.com/v1_1/dsix2a7ia/upload';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'images');

    const response = await fetch(url, { method: 'POST', body: formData });
    const data = await response.json();
    return data.secure_url || null;
  };

  const handleDeposit = async () => {
    if (!user || !businessId || busy) return;

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0 || !description) return;

    try {
      setBusy(true);

      let receiptUrl: string | null = null;
      if (receiptFile) receiptUrl = await uploadImageToCloudinary(receiptFile);

      const newTx: Omit<Transaction, 'id'> = {
        date: new Date().toLocaleString(),
        description,
        amount: parsed,
        ...(receiptUrl ? { receiptUrl } : {}),
        createdByUid: user.uid,
        createdByName: myName || user.email || 'Unknown',
      };

      const docRef = await addDoc(collection(db, 'businesses', businessId, 'transactions'), newTx);

      setTransactions([{ id: docRef.id, ...newTx } as Transaction, ...transactions]);
      setBalance(balance + parsed);

      setAmount('');
      setDescription('');
      setReceiptFile(null);
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !businessId || busy) return;

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0 || parsed > balance || !description) return;

    try {
      setBusy(true);

      let receiptUrl: string | null = null;
      if (receiptFile) receiptUrl = await uploadImageToCloudinary(receiptFile);

      const amt = -parsed;

      const newTx: Omit<Transaction, 'id'> = {
        date: new Date().toLocaleString(),
        description,
        amount: amt,
        ...(receiptUrl ? { receiptUrl } : {}),
        createdByUid: user.uid,
        createdByName: myName || user.email || 'Unknown',
      };

      const docRef = await addDoc(collection(db, 'businesses', businessId, 'transactions'), newTx);

      setTransactions([{ id: docRef.id, ...newTx } as Transaction, ...transactions]);
      setBalance(balance + amt);

      setAmount('');
      setDescription('');
      setReceiptFile(null);
    } finally {
      setBusy(false);
    }
  };

  const deleteTransaction = async (id: string, amount: number) => {
    if (!user || !businessId || busy) return;
    if (role !== 'admin') return;

    try {
      setBusy(true);

      await deleteDoc(doc(db, 'businesses', businessId, 'transactions', id));
      setTransactions(transactions.filter((tx) => tx.id !== id));
      setBalance(balance - amount);
    } finally {
      setBusy(false);
    }
  };

  const openModal = (src: string) => setModalImage(src);
  const closeModal = () => setModalImage(null);

  // ✅ Full-page loading animation
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin" />
          <p className="text-sm text-gray-700 font-semibold">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans relative">
      {/* ✅ Optional overlay spinner during actions */}
      {busy && (
        <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin" />
            <p className="text-sm text-gray-700 font-semibold">Saving…</p>
          </div>
        </div>
      )}

      <br />
      <br />

      {/* Header */}
      <div className="w-full max-w-4xl p-4 mb-4 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-2">Track Expenses</h1>

        <p className="text-gray-600">
          Welcome, {myName}{' '}
          {role === 'admin' ? (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">ADMIN</span>
          ) : null}
        </p>

        <p className={`mt-2 text-xl font-semibold ${balance < 5 ? 'text-red-600' : ''}`}>
          Balance: £{balance.toFixed(2)}
        </p>

        {role === 'admin' && (
          <div className="mt-3">
            <a className="text-blue-600 hover:underline text-sm" href="/admin">
              Go to Admin Panel
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="w-full max-w-4xl flex mb-4">
        {(['deposit', 'withdraw', 'log'] as const).map((tab) => (
          <button
            key={tab}
            disabled={busy}
            className={`flex-1 p-3 rounded-t-lg font-semibold transition ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'deposit' && 'Deposit'}
            {tab === 'withdraw' && 'Withdraw'}
            {tab === 'log' && 'Transaction Log'}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl bg-white rounded-b-lg p-6 shadow-md">
        {activeTab === 'deposit' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Deposit Funds</h2>
            <div className="flex flex-col gap-3">
              <input
                type="number"
                placeholder="Amount (£)"
                className="p-3 rounded border border-gray-300"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
              />
              <input
                type="text"
                placeholder="Description"
                className="p-3 rounded border border-gray-300"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={busy}
              />

              <input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setReceiptFile(e.target.files[0]);
                }}
              />

              <button
                disabled={busy}
                className={`p-3 rounded transition ${
                  busy ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={handleDeposit}
              >
                {busy ? 'Saving…' : 'Deposit'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Withdraw Funds</h2>
            <div className="flex flex-col gap-3">
              <input
                type="number"
                placeholder="Amount (£)"
                className="p-3 rounded border border-gray-300"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
              />
              <input
                type="text"
                placeholder="Description"
                className="p-3 rounded border border-gray-300"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={busy}
              />

              <input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setReceiptFile(e.target.files[0]);
                }}
              />

              <button
                disabled={busy}
                className={`p-3 rounded transition ${
                  busy ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={handleWithdraw}
              >
                {busy ? 'Saving…' : 'Withdraw'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'log' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Transaction Log</h2>
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
<td className="border px-3 py-2">
  {role === 'member' ? (
    <button
      disabled={busy}
      className={`hover:underline ${busy ? 'text-gray-400' : 'text-red-500'}`}
      onClick={() => deleteTransaction(tx.id, tx.amount)}
    >
      Delete
    </button>
  ) : (
    <span className="text-gray-400 text-sm">—</span>
  )}
</td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {role !== 'admin' && <p className="text-xs text-gray-500 mt-2">Only admins can delete transactions.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Modal for image */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="relative">
            <img
              src={modalImage}
              alt="Receipt"
              className="max-h-full max-w-full cursor-zoom-out"
              onClick={(e) => e.stopPropagation()}
            />
            <button className="absolute top-2 right-2 text-white text-3xl font-bold" onClick={closeModal}>
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
