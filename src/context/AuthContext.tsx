"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserData {
  firstName: string;
  lastName: string;
  photoURL: string;
  email: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  role: "admin" | "reader" | null;
  userData: UserData | null;
  emailVerified: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  userData: null,
  emailVerified: false,
  loading: true,
  logout: async () => {},
  refreshRole: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<"admin" | "reader" | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (currentUser: FirebaseUser) => {
    try {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();


        setRole(data.role || "reader");
        setEmailVerified(data.emailVerified === true);

        // Extract firstName/lastName — support both legacy "name" field and new split fields
        let firstName = data.firstName || "";
        let lastName = data.lastName || "";
        if (!firstName && data.name) {
          const parts = (data.name as string).trim().split(/\s+/);
          firstName = parts[0] || "";
          lastName = parts.slice(1).join(" ") || "";
        }

        setUserData({
          firstName,
          lastName,
          photoURL: data.photoURL || "",
          email: data.email || currentUser.email || "",
          emailVerified: data.emailVerified === true,
        });
      } else {
        // If user document does not exist, create it with default "reader" role and unverified
        const displayName = currentUser.displayName || "Reader";
        const parts = displayName.trim().split(/\s+/);
        const firstName = parts[0] || "Reader";
        const lastName = parts.slice(1).join(" ") || "";

        await setDoc(docRef, {
          uid: currentUser.uid,
          firstName,
          lastName,
          name: displayName, // keep legacy field for backward compat
          email: currentUser.email || "",
          role: "reader",
          photoURL: currentUser.photoURL || "",
          createdAt: serverTimestamp(),
          emailVerified: true,
        });
        setRole("reader");
        setEmailVerified(true);
        setUserData({
          firstName,
          lastName,
          photoURL: currentUser.photoURL || "",
          email: currentUser.email || "",
          emailVerified: true,
        });
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRole("reader"); // Fallback to basic reader
      setEmailVerified(false);
    }
  };

  const refreshRole = async () => {
    if (user) {
      await fetchUserRole(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserRole(currentUser);
      } else {
        setRole(null);
        setUserData(null);
        setEmailVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setRole(null);
    setUserData(null);
    setEmailVerified(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, userData, emailVerified, loading, logout, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
