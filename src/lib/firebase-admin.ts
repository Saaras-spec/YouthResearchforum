import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

const adminApp = getApps().length === 0
  ? (serviceAccount
      ? initializeApp({ credential: cert(serviceAccount) })
      : initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "youth-research-50cd9" }))
  : getApp();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
