"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Bookmark, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface BookmarkButtonProps {
  articleId: string;
  articleSlug: string;
}

export default function BookmarkButton({ articleId, articleSlug }: BookmarkButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsSaved(false);
      setLoading(false);
      return;
    }

    const checkBookmarkStatus = async () => {
      try {
        const docRef = doc(db, "bookmarks", `${user.uid}_${articleId}`);
        const docSnap = await getDoc(docRef);
        setIsSaved(docSnap.exists());
      } catch (err) {
        console.error("Error checking bookmark status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkBookmarkStatus();
  }, [user, articleId]);

  const handleToggleBookmark = async () => {
    if (!user) {
      // Redirect to login page
      router.push(`/login`);
      return;
    }

    if (toggling) return;
    setToggling(true);

    const docId = `${user.uid}_${articleId}`;
    const docRef = doc(db, "bookmarks", docId);

    // Optimistic UI Update
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);

    try {
      if (prevSaved) {
        // Remove bookmark
        await deleteDoc(docRef);
      } else {
        // Add bookmark
        await setDoc(docRef, {
          userId: user.uid,
          articleId,
          articleSlug,
          savedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      // Revert optimistic update on error
      setIsSaved(prevSaved);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-2.5 border border-[#e6e2da] bg-white rounded-full flex items-center justify-center h-[38px] w-[38px]">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-editorial-gray" />
      </div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={handleToggleBookmark}
      disabled={toggling}
      className={`p-2.5 border rounded-full transition-all cursor-pointer flex items-center justify-center h-[38px] w-[38px] ${
        isSaved
          ? "border-editorial-accent bg-editorial-accent text-white"
          : "border-[#e6e2da] bg-white text-editorial-gray hover:border-editorial-accent hover:text-editorial-accent"
      }`}
      title={isSaved ? "Remove from Library" : "Save to Library"}
      aria-label={isSaved ? "Remove from Library" : "Save to Library"}
    >
      <Bookmark className={`h-4.5 w-4.5 ${isSaved ? "fill-current" : "stroke-[1.5]"}`} />
    </motion.button>
  );
}
