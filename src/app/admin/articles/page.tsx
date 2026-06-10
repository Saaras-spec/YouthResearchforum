"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getArticles, deleteArticle, Article, DEFAULT_PLACEHOLDER_IMAGE } from "@/lib/db";
import { Edit2, Trash2, Globe, FileText, ArrowRight, Eye } from "lucide-react";

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await getArticles();
      setArticles(data);
    } catch (error) {
      console.error("Failed to load articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This will delete the article and all of its comments. This action cannot be undone.`)) {
      try {
        await deleteArticle(id);
        setArticles(articles.filter((art) => art.id !== id));
      } catch (err) {
        console.error("Failed to delete article: ", err);
        alert("Failed to delete the article. Please try again.");
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Draft";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e6e2da] pb-6">
        <div>
          <h1 className="font-serif text-3xl font-extrabold text-editorial-charcoal">
            Archive Manager
          </h1>
          <p className="text-sm text-editorial-gray mt-1 font-light">
            Edit, view, and delete publications across the forum.
          </p>
        </div>
        <Link
          href="/admin/create"
          className="inline-flex items-center bg-editorial-accent hover:bg-editorial-charcoal text-white text-xs uppercase tracking-widest font-bold px-4 py-2.5 rounded-sm transition-colors"
        >
          Publish New Essay
        </Link>
      </div>

      {/* Table/List */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-16 bg-white border border-[#e6e2da] animate-pulse rounded-sm" />
          <div className="h-16 bg-white border border-[#e6e2da] animate-pulse rounded-sm" />
          <div className="h-16 bg-white border border-[#e6e2da] animate-pulse rounded-sm" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#e6e2da] bg-white rounded-sm">
          <FileText className="h-10 w-10 text-editorial-gray mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-editorial-charcoal">No articles found</h3>
          <p className="text-sm text-editorial-gray mt-1">Write and publish your first article to see it listed here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#e6e2da] bg-white rounded-sm shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-editorial-cream-dark/50 border-b border-[#e6e2da] text-xs font-mono uppercase tracking-wider text-editorial-charcoal">
                <th className="p-4 font-bold">Thumbnail</th>
                <th className="p-4 font-bold">Title</th>
                <th className="p-4 font-bold">Section</th>
                <th className="p-4 font-bold">Date Published</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e2da]">
              {articles.map((art) => (
                <tr key={art.id} className="hover:bg-editorial-cream-dark/10 transition-colors">
                  {/* Image */}
                  <td className="p-4">
                    <div className="relative h-12 w-20 bg-editorial-cream-dark border border-[#e6e2da] rounded-sm overflow-hidden">
                      <Image
                        src={art.coverImage || DEFAULT_PLACEHOLDER_IMAGE}
                        alt={art.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>
                  {/* Title & Author */}
                  <td className="p-4 max-w-xs sm:max-w-md">
                    <p className="text-[10px] font-mono uppercase text-editorial-gold font-bold">{art.category}</p>
                    <h4 className="font-serif font-bold text-editorial-charcoal truncate mt-0.5 leading-snug">
                      {art.title}
                    </h4>
                    <p className="text-xs text-editorial-gray">By {art.authorName}</p>
                  </td>
                  {/* Section */}
                  <td className="p-4">
                    <span className="inline-flex items-center text-xs font-mono uppercase px-2 py-0.5 bg-editorial-cream-dark text-editorial-charcoal border border-[#e6e2da] rounded-sm">
                      {art.section === "national" ? (
                        <>National</>
                      ) : (
                        <>International</>
                      )}
                    </span>
                  </td>
                  {/* Date */}
                  <td className="p-4 font-mono text-xs text-editorial-gray">
                    {formatDate(art.createdAt)}
                  </td>
                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/article/${art.slug}`}
                        target="_blank"
                        className="p-2 text-editorial-gray hover:text-editorial-accent border border-[#e6e2da] hover:border-editorial-accent rounded-sm transition-colors bg-white cursor-pointer"
                        title="View live"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/edit/${art.slug}`}
                        className="p-2 text-editorial-gray hover:text-editorial-accent border border-[#e6e2da] hover:border-editorial-accent rounded-sm transition-colors bg-white cursor-pointer"
                        title="Edit essay"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(art.id!, art.title)}
                        className="p-2 text-editorial-accent hover:text-red-700 border border-[#e6e2da] hover:border-red-700 rounded-sm transition-colors bg-white cursor-pointer"
                        title="Delete essay"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
