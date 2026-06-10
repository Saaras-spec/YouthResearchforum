import React from "react";
import { Metadata } from "next";
import { getArticlesBySection } from "@/lib/db";
import ArticleCard from "@/components/ArticleCard";

export const revalidate = 0; // Disable cache for live updates

export const metadata: Metadata = {
  title: "National Issues & Policy Research",
  description: "Intellectual articles, analyses, and critiques on domestic policy, governance, social change, and national issues.",
};

export default async function NationalPage() {
  const articles = await getArticlesBySection("national");

  return (
    <div className="min-h-screen py-12 bg-editorial-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="pb-8 mb-12 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-editorial-charcoal mb-4">
            National
          </h1>
          <p className="text-base sm:text-lg text-editorial-gray max-w-2xl mx-auto font-light leading-relaxed">
            Rigorous analysis and critiques concerning domestic policy, governance, economic structures, cultural transitions, and social justice within the national sphere.
          </p>
        </div>

        {/* Content Grid */}
        {articles.length === 0 ? (
          <div className="mx-auto max-w-2xl px-4 py-16 text-center">
            <div className="space-y-4">
              <div className="w-12 h-px bg-editorial-accent mx-auto mb-6" />
              <h2 className="font-serif text-3xl font-extrabold text-editorial-charcoal tracking-tight">
                Articles Coming Soon
              </h2>
              <p className="font-sans text-sm text-editorial-gray max-w-md mx-auto leading-relaxed font-light">
                Our team is working on bringing you thoughtful, research-driven content. Check back soon.
              </p>
              <div className="w-12 h-px bg-editorial-accent mx-auto mt-6" />
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
