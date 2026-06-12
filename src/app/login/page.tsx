"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Lock, Mail, User, AlertCircle, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

type AuthStep = "email" | "login" | "signup";

export default function LoginPage() {
  const { user, role, loading, refreshRole, logout } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle auto-redirect if already logged in
  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [user, role, loading, router]);

  // Step 1: Check Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanedEmail = email.trim();

    if (!cleanedEmail || !cleanedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanedEmail }),
      });

      const data = await response.json();

      if (data.success && data.exists) {
        setStep("login");
      } else {
        setStep("signup");
      }
    } catch (err: any) {
      console.error("Email check error:", err);
      // On failure, default to login so the user isn't blocked
      setStep("login");
    } finally {
      setIsSubmitting(false);
    }
  };


  // Step 2a: Log In
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      console.log("[Login] Attempting sign-in for email:", email.trim());
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const authUser = userCredential.user;
      console.log("[Login] Firebase Auth sign-in successful. UID:", authUser.uid);

      // Auto-recreate Firestore profile document if missing
      console.log("[Login] Checking Firestore profile document for UID:", authUser.uid);
      const userDocRef = doc(db, "users", authUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        console.warn("[Login] Firestore profile document missing for UID:", authUser.uid, "- Attempting auto-recreation...");
        const displayName = authUser.displayName || "Reader";
        const parts = displayName.trim().split(/\s+/);
        const firstName = parts[0] || "Reader";
        const lastName = parts.slice(1).join(" ") || "";
        
        await setDoc(userDocRef, {
          uid: authUser.uid,
          firstName,
          lastName,
          name: displayName,
          email: email.trim().toLowerCase(),
          role: "reader",
          photoURL: authUser.photoURL || "",
          createdAt: serverTimestamp(),
          emailVerified: true,
        });
        console.log("[Login] Firestore profile document auto-recreated successfully.");
      } else {
        console.log("[Login] Firestore profile document exists for UID:", authUser.uid);
      }

      console.log("[Login] Refreshing user role in AuthContext...");
      await refreshRole();
      console.log("[Login] User role refreshed successfully.");
    } catch (err: any) {
      console.error("[Login] Login failed:", err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Failed to log in.");
      }
      setIsSubmitting(false);
    }
  };

  // Step 2b: Sign Up
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Firebase Auth user
      console.log("[Signup] Attempting to create Firebase Auth user for email:", email.trim());
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;
      console.log("[Signup] Firebase Auth user created successfully. UID:", firebaseUser.uid);

      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const displayName = `${trimmedFirst} ${trimmedLast}`.trim();

      // 2. Set display name
      console.log("[Signup] Updating Firebase Auth profile display name to:", displayName);
      await updateProfile(firebaseUser, {
        displayName,
      });
      console.log("[Signup] Firebase Auth profile display name updated successfully.");

      // 3. Write user document to Firestore with role 'reader' and emailVerified: true
      console.log("[Signup] Attempting to write Firestore profile document to users/" + firebaseUser.uid);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, {
        uid: firebaseUser.uid,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        name: displayName, // legacy compat
        email: email.trim().toLowerCase(),
        role: "reader",
        photoURL: "",
        createdAt: serverTimestamp(),
        emailVerified: true,
      });
      console.log("[Signup] Firestore profile document written successfully.");

      // 3b. Verify the document exists immediately
      console.log("[Signup] Verifying Firestore document via immediate getDoc for UID:", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        console.log("[Signup] Verification Succeeded! Document exists. Data:", userDocSnap.data());
      } else {
        console.error("[Signup] Verification Failed! Document does NOT exist in Firestore right after setDoc.");
      }

      // 4. Refresh user role and redirect to home
      console.log("[Signup] Refreshing user role in AuthContext...");
      await refreshRole();
      console.log("[Signup] User role refreshed successfully. Redirecting to home...");
      router.push("/");
    } catch (err: any) {
      console.error("[Signup] Signup failed:", err);
      // Construct a very detailed error message so the user can see exact codes (e.g. permission-denied)
      const detailedError = `Error Code: ${err.code || 'N/A'} | Message: ${err.message || err.toString()}`;
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in with your password.");
        setPassword("");
        setStep("login");
      } else {
        setError(`Failed to create account. Detail: ${detailedError}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setPassword("");
    setFirstName("");
    setLastName("");
    setConfirmPassword("");
    setError("");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-editorial-cream py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white border-t-2 border-t-editorial-accent border-x border-b border-[#e6e2da] p-5 sm:p-8 rounded-sm shadow-xs transition-all duration-300">
        
        {/* Logo & Title */}
        <div className="text-center space-y-2.5 flex flex-col items-center">
          <Link href="/" className="hover:opacity-75 transition-opacity duration-200 mb-2 flex flex-col items-center">
            <div className="relative h-16 w-[84px] mb-2">
              <Image
                src="/emblem.png"
                alt="Youth Research Forum — Globe Emblem"
                fill
                sizes="84px"
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <span className="font-serif text-xl font-bold tracking-[0.02em] text-[#930B51]">
              YOUTH RESEARCH FORUM
            </span>
          </Link>
          <span className="text-[10px] font-mono tracking-widest uppercase text-editorial-gold font-bold">
            Portal
          </span>
          <h2 className="font-serif text-3xl font-bold text-editorial-charcoal">
            {step === "email" && "Welcome"}
            {step === "login" && "Log In"}
            {step === "signup" && "Create Reader Account"}
          </h2>
          <p className="text-sm text-editorial-gray font-light max-w-xs mx-auto">
            {step === "email" && "Enter your email to sign in or register a new reader account."}
            {step === "login" && "Enter your password to sign in as a reader or administrator."}
            {step === "signup" && "Provide your details to register as a reader."}
          </p>
        </div>

        {error && (
          <div className="flex items-center text-editorial-accent text-xs bg-red-50 border border-red-200 p-3 rounded-sm">
            <AlertCircle className="h-4.5 w-4.5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* STEP 1: Email Form */}
        {step === "email" && (
          <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
            <div>
              <label htmlFor="email-address" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-editorial-cream-dark/20 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal placeholder-editorial-gray/40 focus:border-editorial-accent transition-colors rounded-sm pl-10"
                  disabled={isSubmitting}
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-gray/60 stroke-[1.5]" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-xs uppercase tracking-widest font-bold text-white bg-editorial-charcoal hover:bg-editorial-accent focus:outline-none transition-all rounded-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Verifying..." : "Continue"}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2a: Login Form */}
        {step === "login" && (
          <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="block text-xs font-mono uppercase tracking-wider text-editorial-gray">
                    Email Address
                  </span>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-[10px] font-mono text-editorial-accent hover:underline flex items-center gap-1 uppercase font-bold cursor-pointer"
                  >
                    <ArrowLeft className="h-3 w-3" /> Change
                  </button>
                </div>
                <div className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] px-3.5 py-2.5 text-sm text-editorial-gray rounded-sm">
                  {email}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-editorial-cream-dark/20 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal placeholder-editorial-gray/40 focus:border-editorial-accent transition-colors rounded-sm pl-10"
                    disabled={isSubmitting}
                  />
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-gray/60 stroke-[1.5]" />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-xs uppercase tracking-widest font-bold text-white bg-editorial-charcoal hover:bg-editorial-accent focus:outline-none transition-all rounded-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Authenticating..." : "Log In"}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2b: Signup Form */}
        {step === "signup" && (
          <form className="mt-8 space-y-4" onSubmit={handleSignupSubmit}>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="block text-xs font-mono uppercase tracking-wider text-editorial-gray">
                  Email Address
                </span>
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-[10px] font-mono text-editorial-accent hover:underline flex items-center gap-1 uppercase font-bold cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" /> Change
                </button>
              </div>
              <div className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] px-3.5 py-2.5 text-sm text-editorial-gray rounded-sm">
                {email}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="first-name" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <input
                    id="first-name"
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-editorial-cream-dark/20 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal placeholder-editorial-gray/40 focus:border-editorial-accent transition-colors rounded-sm pl-10"
                    disabled={isSubmitting}
                  />
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-gray/60 stroke-[1.5]" />
                </div>
              </div>
              <div>
                <label htmlFor="last-name" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                  Last Name
                </label>
                <div className="relative">
                  <input
                    id="last-name"
                    name="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-editorial-cream-dark/20 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal placeholder-editorial-gray/40 focus:border-editorial-accent transition-colors rounded-sm pl-10"
                    disabled={isSubmitting}
                  />
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-gray/60 stroke-[1.5]" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                Password (min 6 chars)
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-editorial-cream-dark/20 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal placeholder-editorial-gray/40 focus:border-editorial-accent transition-colors rounded-sm pl-10"
                  disabled={isSubmitting}
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-gray/60 stroke-[1.5]" />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-editorial-cream-dark/20 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal placeholder-editorial-gray/40 focus:border-editorial-accent transition-colors rounded-sm pl-10"
                  disabled={isSubmitting}
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-gray/60 stroke-[1.5]" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-xs uppercase tracking-widest font-bold text-white bg-editorial-charcoal hover:bg-editorial-accent focus:outline-none transition-all rounded-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Creating Account..." : "Sign Up"}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>
        )}


      </div>
    </div>
  );
}
