import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function ensureInitialized() {
  if (!getApps().length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not defined.");
    }
    initializeApp({
      credential: cert(JSON.parse(key)),
    });
  }
}

// Lazy initialization wrapper to prevent build-time crashes when env vars are missing/undefined
export const adminAuth = {
  getUserByEmail: (email: string) => {
    ensureInitialized();
    return getAuth().getUserByEmail(email);
  }
};

export const adminDb = {
  collection: (collectionPath: string) => {
    ensureInitialized();
    return getFirestore().collection(collectionPath);
  },
  doc: (documentPath: string) => {
    ensureInitialized();
    return getFirestore().doc(documentPath);
  }
};
