"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Article } from "@/lib/db";
import { FileText, Users, Mail, MessageSquare, ArrowUpRight, Plus, RefreshCw } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    articles: 0,
    subscribers: 0,
    comments: 0,
  });
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Sizes (Note: In production with large data, use aggregation queries, but for a startup, getDocs is fine)
      const articlesSnap = await getDocs(collection(db, "articles"));
      const subscribersSnap = await getDocs(collection(db, "newsletterSubscribers"));
      const commentsSnap = await getDocs(collection(db, "comments"));

      setStats({
        articles: articlesSnap.size,
        subscribers: subscribersSnap.size,
        comments: commentsSnap.size,
      });

      // 2. Fetch Recent Articles
      const q = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(5));
      const recentSnap = await getDocs(q);
      const articlesList: Article[] = [];
      recentSnap.forEach((doc) => {
        articlesList.push({ id: doc.id, ...doc.data() } as Article);
      });
      setRecentArticles(articlesList);
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e6e2da] pb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-editorial-charcoal">
            Editor Overview
          </h1>
          <p className="text-sm text-editorial-gray mt-1 font-light">
            Monitor and curate articles, subscribers, and comments.
          </p>
        </div>
        <div className="flex items-center space-x-3.5">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2.5 border border-[#e6e2da] hover:border-editorial-accent bg-white hover:text-editorial-accent rounded-sm text-editorial-gray transition-colors cursor-pointer"
            title="Reload statistics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin/create"
            className="inline-flex items-center bg-editorial-accent hover:bg-editorial-charcoal text-white text-xs uppercase tracking-widest font-bold px-4 py-2.5 rounded-sm transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Essay
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Articles Count */}
        <div className="bg-white border border-[#e6e2da] p-6 rounded-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-editorial-gray font-bold">
              Essays Published
            </span>
            <FileText className="h-5 w-5 text-editorial-accent" />
          </div>
          <div>
            {loading ? (
              <div className="h-10 w-16 bg-editorial-cream-dark/40 animate-pulse rounded-sm" />
            ) : (
              <span className="text-3xl font-serif font-bold text-editorial-charcoal">{stats.articles}</span>
            )}
          </div>
        </div>

        {/* Subscribers Count */}
        <div className="bg-white border border-[#e6e2da] p-6 rounded-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-editorial-gray font-bold">
              Subscribers
            </span>
            <Mail className="h-5 w-5 text-editorial-accent" />
          </div>
          <div>
            {loading ? (
              <div className="h-10 w-16 bg-editorial-cream-dark/40 animate-pulse rounded-sm" />
            ) : (
              <span className="text-3xl font-serif font-bold text-editorial-charcoal">{stats.subscribers}</span>
            )}
          </div>
        </div>

        {/* Comments Count */}
        <div className="bg-white border border-[#e6e2da] p-6 rounded-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-editorial-gray font-bold">
              Comments Posted
            </span>
            <MessageSquare className="h-5 w-5 text-editorial-accent" />
          </div>
          <div>
            {loading ? (
              <div className="h-10 w-16 bg-editorial-cream-dark/40 animate-pulse rounded-sm" />
            ) : (
              <span className="text-3xl font-serif font-bold text-editorial-charcoal">{stats.comments}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left / Center Section: Recent publications list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-[#e6e2da] pb-3">
            <h3 className="font-serif text-xl font-bold text-editorial-charcoal">
              Recent Submissions
            </h3>
            <Link
              href="/admin/articles"
              className="text-xs font-mono uppercase tracking-widest text-editorial-accent font-bold hover:underline"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-14 bg-white border border-[#e6e2da] animate-pulse rounded-sm" />
              <div className="h-14 bg-white border border-[#e6e2da] animate-pulse rounded-sm" />
            </div>
          ) : recentArticles.length === 0 ? (
            <p className="text-sm text-editorial-gray italic py-4">No articles published yet.</p>
          ) : (
            <div className="divide-y divide-[#e6e2da] border border-[#e6e2da] bg-white rounded-sm">
              {recentArticles.map((art) => (
                <div key={art.slug} className="flex justify-between items-center p-4 hover:bg-editorial-cream-dark/10 transition-colors">
                  <div className="min-w-0 pr-4">
                    <p className="text-[10px] font-mono uppercase text-editorial-gold font-bold">
                      {art.category} • {art.section}
                    </p>
                    <h4 className="font-serif text-sm sm:text-base font-bold text-editorial-charcoal truncate mt-0.5">
                      {art.title}
                    </h4>
                    <p className="text-xs text-editorial-gray mt-0.5">By {art.authorName}</p>
                  </div>
                  <Link
                    href={`/article/${art.slug}`}
                    target="_blank"
                    className="p-2 border border-[#e6e2da] hover:border-editorial-accent text-editorial-gray hover:text-editorial-accent rounded-sm transition-colors flex-shrink-0"
                    title="View live publication"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Section: Quick Editor Help */}
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-bold text-editorial-charcoal border-b border-[#e6e2da] pb-3">
            Quick Actions
          </h3>
          <div className="bg-white border border-[#e6e2da] p-6 rounded-sm space-y-4">
            <h4 className="font-serif text-md font-bold text-editorial-charcoal">
              Editorial Guidelines
            </h4>
            <ul className="text-xs text-editorial-gray leading-relaxed font-light space-y-2 list-disc list-inside">
              <li>Keep paragraphs concise to aid on-screen reading.</li>
              <li>Include header tags (##, ###) to structure long-form essays.</li>
              <li>Always check image credits and formatting before submitting.</li>
            </ul>
            <Link
              href="/admin/create"
              className="inline-block w-full text-center bg-editorial-charcoal hover:bg-editorial-accent text-white uppercase text-[10px] tracking-widest font-bold py-2.5 transition-all rounded-sm"
            >
              Write New Essay
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
