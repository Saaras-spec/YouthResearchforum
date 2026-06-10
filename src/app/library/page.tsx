"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Article } from "@/lib/db";
import ArticleCard from "@/components/ArticleCard";
import { Bookmark, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!user) return;

    const fetchBookmarks = async () => {
      try {
        // Query bookmarks matching current userId
        const bookmarksRef = collection(db, "bookmarks");
        const q = query(bookmarksRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setArticles([]);
          setLoading(false);
          return;
        }

        // Fetch each corresponding article in parallel
        const articlePromises = querySnapshot.docs.map(async (bookmarkDoc) => {
          const bookmarkData = bookmarkDoc.data();
          const articleRef = doc(db, "articles", bookmarkData.articleId);
          const articleSnap = await getDoc(articleRef);

          if (articleSnap.exists()) {
            return { id: articleSnap.id, ...articleSnap.data() } as Article;
          }
          return null;
        });

        const fetchedArticles = (await Promise.all(articlePromises)).filter(
          (article): article is Article => article !== null
        );

        setArticles(fetchedArticles);
      } catch (err) {
        console.error("Error fetching library bookmarks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-editorial-cream flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-editorial-accent mb-2" />
        <p className="text-xs font-mono uppercase tracking-widest text-editorial-gray">
          Loading library archives...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 bg-editorial-cream font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="pb-8 mb-12 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-editorial-charcoal mb-4">
            My Library
          </h1>
          <p className="text-base sm:text-lg text-editorial-gray max-w-2xl mx-auto font-light leading-relaxed">
            Your saved publications, research, and critiques. Access your bookmarks and read at your leisure.
          </p>
        </div>

        {/* Content Layout */}
        {articles.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#e6e2da] bg-white rounded-sm max-w-2xl mx-auto shadow-xs p-8">
            <Bookmark className="h-10 w-10 text-editorial-gold mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-serif text-xl font-bold text-editorial-charcoal">Your library is empty</h3>
            <p className="text-sm text-editorial-gray mt-2 max-w-md mx-auto font-light">
              Bookmark insightful essays and publications from our archives to build your curated research collection.
            </p>
            <div className="mt-8">
              <Link
                href="/"
                className="font-sans text-xs tracking-widest uppercase text-white bg-editorial-charcoal hover:bg-editorial-accent px-6 py-3 rounded-sm transition-all inline-block font-bold cursor-pointer"
              >
                Explore Publications
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="vertical" />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
