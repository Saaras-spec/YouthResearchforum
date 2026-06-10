"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Bookmark, Mail, Share2, Link as LinkIcon, Loader2, Check } from "lucide-react";

interface ArticleActionsProps {
  articleId: string;
  articleSlug: string;
  title: string;
}

// Custom SVG Icons for X (formerly Twitter) and WhatsApp
const XIcon = () => (
  <svg className="h-4 w-4 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="h-4 w-4 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.023-5.115-2.89-6.984C16.279 1.89 13.8 1.865 12.006 1.865c-5.437 0-9.863 4.421-9.867 9.865 0 2.13.56 4.202 1.623 6.013l-.973 3.553 3.633-.953zm10.873-7.42c-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-4 w-4 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
  </svg>
);

export default function ArticleActions({ articleId, articleSlug, title }: ArticleActionsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentUrl, setCurrentUrl] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(true);
  const [bookmarkToggling, setBookmarkToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  // Set URL on client mount
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  // Fetch bookmark status
  useEffect(() => {
    if (!user) {
      setIsSaved(false);
      setBookmarkLoading(false);
      return;
    }

    const checkBookmarkStatus = async () => {
      try {
        const docRef = doc(db, "bookmarks", `${user.uid}_${articleId}`);
        const docSnap = await getDoc(docRef);
        setIsSaved(docSnap.exists());
      } catch (err) {
        console.error("Error checking bookmark status in actions:", err);
      } finally {
        setBookmarkLoading(false);
      }
    };

    checkBookmarkStatus();
  }, [user, articleId]);

  // Click outside to close share menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        shareMenuRef.current && 
        !shareMenuRef.current.contains(event.target as Node) &&
        shareButtonRef.current &&
        !shareButtonRef.current.contains(event.target as Node)
      ) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShareMenu]);

  const handleToggleBookmark = async () => {
    if (!user) {
      router.push(`/login`);
      return;
    }

    if (bookmarkToggling) return;
    setBookmarkToggling(true);

    const docId = `${user.uid}_${articleId}`;
    const docRef = doc(db, "bookmarks", docId);

    const prevSaved = isSaved;
    setIsSaved(!prevSaved);

    try {
      if (prevSaved) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          userId: user.uid,
          articleId,
          articleSlug,
          savedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Error toggling bookmark in actions:", err);
      setIsSaved(prevSaved);
    } finally {
      setBookmarkToggling(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareButtons = [
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: <XIcon />,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      isLink: true,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <FacebookIcon />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      isLink: true,
    },
    {
      id: "email",
      name: "Email",
      icon: <Mail className="h-4 w-4 text-white stroke-[1.8]" />,
      url: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      isLink: true,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: <WhatsAppIcon />,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      isLink: true,
    },
    {
      id: "copy",
      name: "Copy Link",
      icon: copied ? (
        <Check className="h-4 w-4 text-white stroke-[2.5]" />
      ) : (
        <LinkIcon className="h-4 w-4 text-white stroke-[1.8]" />
      ),
      action: handleCopyLink,
      isLink: false,
    },
  ];

  return (
    <div className="flex items-center gap-8 py-5 border-t border-[#e6e2da] mt-10 mb-6 select-none relative font-sans">
      
      {/* Save Button */}
      <button
        onClick={handleToggleBookmark}
        disabled={bookmarkLoading || bookmarkToggling}
        className="flex items-center gap-2.5 text-editorial-charcoal hover:text-editorial-accent transition-colors duration-200 cursor-pointer text-[13px] tracking-wider uppercase font-semibold disabled:opacity-50"
      >
        {bookmarkLoading ? (
          <Loader2 className="h-4.5 w-4.5 animate-spin" />
        ) : (
          <Bookmark className={`h-4.5 w-4.5 ${isSaved ? "fill-editorial-charcoal" : "stroke-[1.5]"}`} />
        )}
        <span>{isSaved ? "Saved" : "Save"}</span>
      </button>

      {/* Share Button & Popover Wrapper */}
      <div className="relative">
        <button
          ref={shareButtonRef}
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="flex items-center gap-2.5 text-editorial-accent hover:opacity-85 transition-opacity duration-200 cursor-pointer text-[13px] tracking-wider uppercase font-semibold"
        >
          <Share2 className="h-4.5 w-4.5 stroke-[1.8] fill-none" />
          <span>Share</span>
        </button>

        {/* Custom Sharing Tooltip Box */}
        {showShareMenu && (
          <div
            ref={shareMenuRef}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white border border-[#e6e2da] shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-md p-3.5 z-40 w-[160px] flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            {/* Row 1: X, Facebook, Email */}
            <div className="flex items-center justify-between">
              {shareButtons.slice(0, 3).map((btn) => {
                const buttonContent = (
                  <button
                    onClick={btn.isLink ? undefined : btn.action}
                    className="w-9 h-9 rounded-full bg-editorial-charcoal hover:bg-editorial-accent text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-sm relative group"
                    aria-label={btn.name}
                    title={btn.name}
                  >
                    {btn.icon}
                  </button>
                );

                if (btn.isLink) {
                  return (
                    <a
                      key={btn.id}
                      href={btn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {buttonContent}
                    </a>
                  );
                }

                return <React.Fragment key={btn.id}>{buttonContent}</React.Fragment>;
              })}
            </div>

            {/* Row 2: WhatsApp, Copy Link */}
            <div className="flex items-center gap-3.5 justify-start">
              {shareButtons.slice(3).map((btn) => {
                const buttonContent = (
                  <button
                    onClick={btn.isLink ? undefined : btn.action}
                    className={`w-9 h-9 rounded-full text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-sm relative group ${
                      btn.id === "copy" && copied 
                        ? "bg-emerald-700 hover:bg-emerald-800" 
                        : "bg-editorial-charcoal hover:bg-editorial-accent"
                    }`}
                    aria-label={btn.name}
                    title={btn.name}
                  >
                    {btn.icon}
                  </button>
                );

                if (btn.isLink) {
                  return (
                    <a
                      key={btn.id}
                      href={btn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {buttonContent}
                    </a>
                  );
                }

                return (
                  <div key={btn.id} className="relative">
                    {buttonContent}
                    {btn.id === "copy" && copied && (
                      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-emerald-700 text-white text-[9px] font-mono tracking-wider px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-50 uppercase animate-in fade-in zoom-in-95 duration-100">
                        Copied!
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Little pointing triangle at the bottom of the tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-2.5 h-2.5 bg-white border-r border-b border-[#e6e2da] rotate-45" />
          </div>
        )}
      </div>

    </div>
  );
}
