// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDsGMEneF8bhVEtaM2cUzlcrcJVewuvbb8",
  authDomain: "adullam-leadership-academy.firebaseapp.com",
  projectId: "adullam-leadership-academy",
  storageBucket: "adullam-leadership-academy.firebasestorage.app",
  messagingSenderId: "998810240112",
  appId: "1:998810240112:web:7f345c239cacea313b20b5",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
