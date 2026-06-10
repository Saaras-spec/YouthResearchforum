import React from "react";
import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-editorial-cream px-4 font-sans">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Large 404 Typography */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-editorial-accent font-bold">
            Error 404
          </span>
          <h1 className="font-serif text-7xl sm:text-9xl font-extrabold text-editorial-charcoal tracking-tighter leading-none">
            404
          </h1>
        </div>

        <div className="space-y-3">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-editorial-charcoal">
            Page Not Found
          </h2>
          <p className="text-sm sm:text-base text-editorial-gray font-light leading-relaxed max-w-sm mx-auto">
            The article or page you are looking for may have been removed, renamed, or is temporarily
            unavailable. Please check the URL or navigate back to the archives.
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center space-x-4">
          <div className="h-px w-16 bg-[#e6e2da]" />
          <FileQuestion className="h-5 w-5 text-editorial-gold" />
          <div className="h-px w-16 bg-[#e6e2da]" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/"
            className="inline-flex items-center bg-editorial-charcoal hover:bg-editorial-accent text-white uppercase text-xs tracking-widest font-bold px-6 py-3 rounded-sm transition-all"
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Homepage
          </Link>
          <Link
            href="/national"
            className="inline-flex items-center border border-[#e6e2da] hover:border-editorial-accent text-editorial-charcoal hover:text-editorial-accent uppercase text-xs tracking-widest font-bold px-6 py-3 rounded-sm transition-all bg-white"
          >
            Browse Archives
          </Link>
        </div>
      </div>
    </div>
  );
}
