"use client";

import React, { useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Mail, Check, AlertCircle } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<"daily" | "weekly">("weekly");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    try {
      const cleanedEmail = email.trim().toLowerCase();
      const subscriberRef = doc(db, "newsletterSubscribers", cleanedEmail);
      
      await setDoc(subscriberRef, {
        email: cleanedEmail,
        subscriptionType,
        subscribedAt: serverTimestamp(),
      });

      setStatus("success");
      setEmail("");
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again later.");
    }
  };

  return (
    <footer className="bg-editorial-cream-dark border-t border-[#e6e2da] pt-16 pb-12 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 border-b border-[#e6e2da] pb-12">
          
          {/* Sections Column (Links Left) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-editorial-charcoal">Sections</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-editorial-gray hover:text-editorial-accent transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/national" className="text-sm text-editorial-gray hover:text-editorial-accent transition-colors">
                  National
                </Link>
              </li>
              <li>
                <Link href="/international" className="text-sm text-editorial-gray hover:text-editorial-accent transition-colors">
                  International
                </Link>
              </li>
            </ul>
          </div>

          {/* Information Column (Links Left) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-editorial-charcoal">Information</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-sm text-editorial-gray hover:text-editorial-accent transition-colors">
                  Our Mission & About Us
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-editorial-gray hover:text-editorial-accent transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-editorial-gray hover:text-editorial-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-editorial-gray hover:text-editorial-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-editorial-gray hover:text-editorial-accent transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow YRF Column (Socials Middle) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-editorial-charcoal">Follow YRF</h4>
            <div className="flex items-center space-x-4.5 pt-1">
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/youth-research-forum/posts/?feedView=all"
                target="_blank"
                rel="noopener noreferrer"
                className="text-editorial-gray hover:text-editorial-accent transition-colors duration-200 cursor-pointer flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <svg className="h-4.5 w-4.5 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://www.instagram.com/youthresearchforum?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="text-editorial-gray hover:text-editorial-accent transition-colors duration-200 cursor-pointer flex items-center justify-center"
                aria-label="Instagram"
              >
                <svg className="h-4.5 w-4.5 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              {/* X (formerly Twitter) */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-editorial-gray hover:text-editorial-accent transition-colors duration-200 cursor-pointer flex items-center justify-center"
                aria-label="X (Twitter)"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-editorial-gray hover:text-editorial-accent transition-colors duration-200 cursor-pointer flex items-center justify-center"
                aria-label="YouTube"
              >
                <svg className="h-4.5 w-4.5 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path>
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
                </svg>
              </a>
            </div>
          </div>

          {/* Newsletter signup (Right Column) */}
          <div className="space-y-4 bg-editorial-cream border border-[#e6e2da] p-6 rounded-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-editorial-charcoal flex items-center">
              <Mail className="h-4 w-4 mr-2 text-editorial-accent" />
              Subscribe to Newsletter
            </h4>
            <p className="text-xs text-editorial-gray leading-normal">
              Get our deepest articles delivered straight to your inbox.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-[#e6e2da] px-3 py-2 text-sm outline-none text-editorial-charcoal placeholder-editorial-gray/50 focus:border-editorial-accent transition-colors rounded-sm"
                required
                disabled={status === "loading"}
              />

              <div className="flex justify-between items-center bg-white border border-[#e6e2da] px-3 py-1 rounded-sm">
                <span className="text-[10px] uppercase font-bold text-editorial-gray tracking-wider">Interval</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setSubscriptionType("weekly")}
                    className={`text-[10px] font-bold uppercase py-1 px-2.5 rounded-sm transition-all cursor-pointer ${
                      subscriptionType === "weekly"
                        ? "bg-editorial-accent text-white"
                        : "text-editorial-gray hover:text-editorial-charcoal"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubscriptionType("daily")}
                    className={`text-[10px] font-bold uppercase py-1 px-2.5 rounded-sm transition-all cursor-pointer ${
                      subscriptionType === "daily"
                        ? "bg-editorial-accent text-white"
                        : "text-[#5a5a5a] hover:text-editorial-charcoal"
                    }`}
                  >
                    Daily
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-editorial-charcoal hover:bg-editorial-accent text-white uppercase text-xs tracking-widest font-bold py-2.5 transition-all rounded-sm cursor-pointer disabled:opacity-50"
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </button>
            </form>

            {status === "success" && (
              <div className="flex items-center text-emerald-700 text-xs mt-2 bg-emerald-50 border border-emerald-200 p-2 rounded-sm">
                <Check className="h-4 w-4 mr-1.5 flex-shrink-0" />
                Thank you for subscribing!
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center text-editorial-accent text-xs mt-2 bg-red-50 border border-red-200 p-2 rounded-sm">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errorMessage}
              </div>
            )}
          </div>

        </div>

        {/* Bottom Credits */}
        <div className="pt-8 text-xs text-editorial-gray flex flex-col sm:flex-row items-center justify-between">
          <p>© 2026 Youth Research Forum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
