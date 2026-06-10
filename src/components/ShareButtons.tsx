"use client";

import React, { useState } from "react";
import { Link2, Check } from "lucide-react";

interface ShareButtonsProps {
  title: string;
}

export default function ShareButtons({ title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  };

  const handleCopy = () => {
    const url = getUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(`Read "${title}" on Youth Research Forum:`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
  };

  const shareFacebook = () => {
    const url = encodeURIComponent(getUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  return (
    <div className="flex items-center space-x-3.5">
      <span className="text-xs font-mono uppercase tracking-widest text-editorial-gray">
        Share
      </span>
      <div className="flex space-x-2">
        {/* Twitter/X Icon */}
        <button
          onClick={shareTwitter}
          className="p-2 border border-[#e6e2da] hover:border-editorial-accent hover:text-editorial-accent bg-white text-editorial-gray rounded-full transition-colors cursor-pointer flex items-center justify-center"
          aria-label="Share on Twitter"
        >
          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </button>

        {/* Facebook Icon */}
        <button
          onClick={shareFacebook}
          className="p-2 border border-[#e6e2da] hover:border-editorial-accent hover:text-editorial-accent bg-white text-editorial-gray rounded-full transition-colors cursor-pointer flex items-center justify-center"
          aria-label="Share on Facebook"
        >
          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z"/>
          </svg>
        </button>

        {/* Link Icon */}
        <button
          onClick={handleCopy}
          className="p-2 border border-[#e6e2da] hover:border-editorial-accent hover:text-editorial-accent bg-white text-editorial-gray rounded-full transition-colors relative cursor-pointer flex items-center justify-center"
          aria-label="Copy link to clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
          ) : (
            <Link2 className="h-3.5 w-3.5 stroke-[1.5]" />
          )}
          {copied && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-editorial-charcoal text-white text-[10px] uppercase font-mono tracking-widest whitespace-nowrap rounded-sm">
              Copied!
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

