"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function VerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshRole, user } = useAuth();
  
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("Verification token is missing. Please check your verification link.");
        return;
      }

      try {
        const response = await fetch("/api/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setVerifiedEmail(data.email || "");
          setStatus("success");
          
          // Refresh user context details in background
          if (user) {
            try {
              await refreshRole();
            } catch (roleErr) {
              console.error("Failed to refresh user auth role:", roleErr);
            }
          }
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Verification failed. The link may be invalid or expired.");
        }
      } catch (err) {
        console.error("Token verification fetch error:", err);
        setStatus("error");
        setErrorMessage("A network error occurred. Please try again later.");
      }
    };

    verifyToken();
  }, [token, refreshRole, user]);

  return (
    <div className="max-w-md w-full space-y-8 bg-white border-t-2 border-t-editorial-accent border-x border-b border-[#e6e2da] p-8 rounded-sm shadow-xs text-center">
      
      {/* Emblem Header */}
      <div className="flex flex-col items-center">
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
          Verification
        </span>
      </div>

      {/* States */}
      {status === "verifying" && (
        <div className="py-6 flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 text-editorial-accent animate-spin" />
          <h2 className="font-serif text-2xl font-bold text-editorial-charcoal">
            Verifying your email...
          </h2>
          <p className="text-sm text-editorial-gray font-light max-w-xs">
            We are confirming your registration token with our secure archives. Please hold on.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="py-4 space-y-5 flex flex-col items-center">
          <CheckCircle className="h-14 w-14 text-emerald-600 stroke-[1.5] animate-bounce" />
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-editorial-charcoal">
              Account Verified!
            </h2>
            <p className="text-sm text-editorial-gray font-light max-w-xs leading-relaxed">
              Thank you for verifying your email address {verifiedEmail && <strong>({verifiedEmail})</strong>}. Your registration is complete.
            </p>
          </div>
          
          <div className="pt-4 w-full">
            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent text-xs uppercase tracking-widest font-bold text-white bg-editorial-charcoal hover:bg-editorial-accent focus:outline-none transition-all rounded-sm"
            >
              Sign In to Portal
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="py-4 space-y-5 flex flex-col items-center">
          <XCircle className="h-14 w-14 text-editorial-accent stroke-[1.5]" />
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-editorial-charcoal">
              Verification Failed
            </h2>
            <p className="text-sm text-editorial-accent font-light max-w-xs bg-red-50 border border-red-200 p-3.5 rounded-sm">
              {errorMessage}
            </p>
          </div>

          <p className="text-xs text-editorial-gray font-light max-w-xs leading-normal">
            Verification links expire after 15 minutes. If you need a new link, please sign up again.
          </p>
          
          <div className="pt-4 w-full">
            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-[#e6e2da] text-xs uppercase tracking-widest font-bold text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/30 focus:outline-none transition-all rounded-sm"
            >
              Return to Portal
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-editorial-cream py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white border border-[#e6e2da] p-8 rounded-sm shadow-xs flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 text-editorial-accent animate-spin" />
          <span className="text-sm font-mono text-editorial-gray uppercase tracking-widest">Loading...</span>
        </div>
      }>
        <VerificationContent />
      </Suspense>
    </div>
  );
}
