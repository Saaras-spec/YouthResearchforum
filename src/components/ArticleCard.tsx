"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Bookmark, Loader2 } from "lucide-react";
import { Article, DEFAULT_PLACEHOLDER_IMAGE } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

interface ArticleCardProps {
  article: Article;
  variant?: "vertical" | "horizontal" | "compact";
}

/* ── Inline Card Bookmark Button ────────────────────────────── */
function CardBookmarkButton({ articleId, articleSlug }: { articleId: string; articleSlug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsSaved(false);
      setLoading(false);
      return;
    }
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, "bookmarks", `${user.uid}_${articleId}`));
        setIsSaved(snap.exists());
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [user, articleId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    if (toggling) return;
    setToggling(true);
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      const ref = doc(db, "bookmarks", `${user.uid}_${articleId}`);
      if (prev) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, { userId: user.uid, articleId, articleSlug, savedAt: serverTimestamp() });
      }
    } catch {
      setIsSaved(prev);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-editorial-gray" />
      </div>
    );
  }

  return (
    <motion.button
      layout
      whileTap={{ scale: 0.92 }}
      onClick={handleToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={toggling}
      className={`flex items-center justify-center transition-all duration-300 shadow-sm cursor-pointer rounded-full ${
        isSaved
          ? "bg-editorial-accent text-white"
          : "bg-white/90 backdrop-blur-sm text-editorial-charcoal hover:bg-white"
      } ${
        isHovered
          ? "px-3.5 h-8"
          : "w-8 h-8"
      }`}
      title={isSaved ? "Remove from Library" : "Save to Library"}
      aria-label={isSaved ? "Remove from Library" : "Save to Library"}
    >
      <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : "stroke-[1.5]"}`} />
      {isHovered && (
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[10px] font-sans font-semibold uppercase tracking-wider leading-none ml-1.5"
        >
          {isSaved ? "Saved" : "Save"}
        </motion.span>
      )}
    </motion.button>
  );
}

/* ── Article Card Component ─────────────────────────────────── */
export default function ArticleCard({ article, variant = "vertical" }: ArticleCardProps) {
  const { title, subtitle, coverImage, authorName, createdAt, readingTime, slug, category } = article;

  // Format date helper
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Recently";
    let date: Date;
    if (typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp && typeof timestamp === "object") {
      const seconds = timestamp.seconds !== undefined ? timestamp.seconds : timestamp._seconds;
      if (seconds !== undefined) {
        date = new Date(seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      return "Recently";
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (variant === "horizontal") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center border-b border-[#e6e2da] pb-8 pt-4"
      >
        {/* Cover Image */}
        <div className="md:col-span-5 overflow-hidden relative aspect-[16/10] bg-editorial-cream-dark">
          <Link href={`/article/${slug}`} className="absolute inset-0 z-[1]">
            <Image
              src={coverImage || DEFAULT_PLACEHOLDER_IMAGE}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              priority={article.featured}
            />
          </Link>
        </div>

        {/* Content */}
        <div className="md:col-span-7 flex flex-col justify-between h-full py-1">
          <div>
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-editorial-gold mb-2 h-8">
              <span>Essay / {category}</span>
              {article.id && (
                <CardBookmarkButton articleId={article.id} articleSlug={slug} />
              )}
            </div>

            <Link href={`/article/${slug}`}>
              <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-editorial-charcoal leading-tight mb-3">
                {title}
              </h3>
            </Link>

            <p className="text-sm sm:text-base text-editorial-charcoal leading-relaxed font-sans mb-4 font-light line-clamp-3">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-sm sm:text-base font-sans tracking-wide text-editorial-charcoal font-semibold">
              {authorName}
            </span>
            <Link
              href={`/article/${slug}`}
              className="text-xs font-mono uppercase tracking-widest text-editorial-accent font-bold flex items-center group/btn transition-opacity hover:opacity-80"
            >
              Read Essay
              <ArrowRight className="h-3.5 w-3.5 ml-1.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group py-4 border-b border-[#e6e2da] hover:bg-editorial-cream-dark/20 transition-all duration-300 px-2 rounded-sm"
      >
        <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-editorial-gold mb-1">
          <span>{category}</span>
        </div>
        <Link href={`/article/${slug}`}>
          <h4 className="font-serif text-md sm:text-lg font-bold text-editorial-charcoal leading-snug">
            {title}
          </h4>
        </Link>
        <p className="text-sm font-medium text-editorial-gray mt-1.5">{authorName}</p>
      </motion.div>
    );
  }

  // Default: Vertical Card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group flex flex-col h-full transition-all duration-300"
    >
      {/* Cover Image */}
      <div className="overflow-hidden relative h-56 w-full bg-editorial-cream-dark mb-4">
        <Link href={`/article/${slug}`} className="absolute inset-0 z-[1]">
          <Image
            src={coverImage || DEFAULT_PLACEHOLDER_IMAGE}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 30vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-editorial-gold mb-2 h-8">
          <span>Essay / {category}</span>
          {article.id && (
            <CardBookmarkButton articleId={article.id} articleSlug={slug} />
          )}
        </div>

        <Link href={`/article/${slug}`} className="flex-grow">
          <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-editorial-charcoal leading-snug mb-2.5">
            {title}
          </h3>
          <p className="text-base text-editorial-charcoal leading-relaxed font-light line-clamp-3 mb-4">
            {subtitle}
          </p>
        </Link>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-sm font-sans tracking-wide text-editorial-charcoal font-semibold">
            {authorName}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
