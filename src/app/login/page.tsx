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
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Lock, Mail, User, AlertCircle, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

type AuthStep = "email" | "login" | "signup" | "verification-sent";

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
      let userExists = false;

      // 1. Try checking using fetchSignInMethodsForEmail
      try {
        const methods = await fetchSignInMethodsForEmail(auth, cleanedEmail);
        if (methods && methods.length > 0) {
          userExists = true;
        }
      } catch (authErr) {
        console.warn("Firebase Auth signInMethods check skipped/failed:", authErr);
      }

      // 2. Double check Firestore users collection
      if (!userExists) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", cleanedEmail.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          userExists = true;
        }
      }

      if (userExists) {
        setStep("login");
      } else {
        setStep("signup");
      }
    } catch (err: any) {
      console.error("Email verification error:", err);
      setError("Could not verify email. Please try again.");
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
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const authUser = userCredential.user;

      // Check verification status in Firestore
      const userDocRef = doc(db, "users", authUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.role !== "admin" && userData.emailVerified === false) {
          // Trigger automatic resend of verification email
          try {
            await fetch("/api/send-verification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: email.trim().toLowerCase(),
                userId: authUser.uid,
                name: userData.name || `${userData.firstName} ${userData.lastName}` || "Reader",
              }),
            });
          } catch (sendErr) {
            console.error("Resend verification error:", sendErr);
          }

          // Log out and show verification page
          await logout();
          setStep("verification-sent");
          setIsSubmitting(false);
          return;
        }
      }

      await refreshRole();
    } catch (err: any) {
      console.error("Login error:", err);
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
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const displayName = `${trimmedFirst} ${trimmedLast}`.trim();

      // 2. Set display name
      await updateProfile(firebaseUser, {
        displayName,
      });

      // 3. Write user document to Firestore with role 'reader' and emailVerified: false
      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        name: displayName, // legacy compat
        email: email.trim().toLowerCase(),
        role: "reader",
        photoURL: "",
        createdAt: serverTimestamp(),
        emailVerified: false,
      });

      // 4. Trigger sending the verification email via API
      try {
        await fetch("/api/send-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            userId: firebaseUser.uid,
            name: displayName,
          }),
        });
      } catch (sendErr) {
        console.error("Failed to trigger verification email sending:", sendErr);
      }

      // 5. Sign out the user and transition to 'verification-sent' screen
      await logout();
      setStep("verification-sent");
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email address is already registered.");
      } else {
        setError(err.message || "Failed to create account.");
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
      <div className="max-w-md w-full space-y-8 bg-white border-t-2 border-t-editorial-accent border-x border-b border-[#e6e2da] p-8 rounded-sm shadow-xs transition-all duration-300">
        
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
                  placeholder="name@university.edu"
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
                    placeholder="••••••••"
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

            <div className="grid grid-cols-2 gap-3">
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
                    placeholder="Jane"
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
                    placeholder="Doe"
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
                  placeholder="••••••••"
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
                  placeholder="••••••••"
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

        {/* STEP 2c: Verification Sent Screen */}
        {step === "verification-sent" && (
          <div className="mt-6 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-emerald-600 stroke-[1.5] animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-xl font-bold text-editorial-charcoal">Check your inbox</h3>
              <p className="text-sm text-editorial-gray font-light leading-relaxed">
                A verification link has been sent to <strong className="text-editorial-charcoal">{email}</strong>.
              </p>
              <p className="text-xs text-editorial-gray/80 font-light leading-relaxed pt-2">
                Please click the link inside the email to activate your account. The link expires in 15 minutes. Once verified, you can sign in.
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="group relative w-full flex justify-center py-3 px-4 border border-[#e6e2da] text-xs uppercase tracking-widest font-bold text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/30 transition-all rounded-sm cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
