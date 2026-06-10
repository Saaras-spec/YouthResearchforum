import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getArticles, getFeaturedArticle, DEFAULT_PLACEHOLDER_IMAGE, getDisplayType } from "@/lib/db";
import ArticleCard from "@/components/ArticleCard";

export const revalidate = 0; // Disable caching for dynamic content during development/testing

export default async function HomePage() {
  const featuredArticle = await getFeaturedArticle();
  const latestArticles = await getArticles(6);

  const dbIsEmpty = !featuredArticle && latestArticles.length === 0;

  return (
    <div className="min-h-screen bg-editorial-cream">
      {dbIsEmpty ? (
        <div className="mx-auto max-w-2xl px-4 py-24 text-center min-h-[60vh] flex flex-col justify-center">
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
        <div>
          {/* 1. HERO FEATURED ARTICLE SECTION - Mobile: Image first, Text below. Desktop: Overlaid image */}
          {featuredArticle && (
            <section className="mx-4 sm:mx-8 lg:mx-10 mt-4 group cursor-pointer bg-white">
              <Link href={`/article/${featuredArticle.slug}`} className="block sm:relative sm:h-[70vh] w-full overflow-hidden">
                {/* Background Image Container */}
                <div className="relative w-full aspect-[16/10] sm:absolute sm:inset-0 sm:h-full bg-[#f4f4f4]">
                  <Image
                    src={featuredArticle.coverImage || DEFAULT_PLACEHOLDER_IMAGE}
                    alt={featuredArticle.title}
                    fill
                    sizes="100vw"
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-102"
                    priority
                  />
                </div>
                
                {/* Dark Overlay (hidden on mobile, visible on desktop overlay) */}
                <div className="hidden sm:block absolute inset-0 transition-opacity duration-500 group-hover:opacity-90" style={{ backgroundColor: "rgba(0, 0, 0, 0.35)" }} />
                
                {/* Desktop Overlay Text (Centered) */}
                <div className="hidden sm:flex absolute inset-0 items-start justify-center text-center p-12 md:p-16 z-10 pt-16">
                  <div className="max-w-3xl px-4 flex flex-col items-center justify-center text-center w-full">
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-md tracking-tight select-none">
                      {featuredArticle.title}
                    </h1>
                    <p className="font-serif text-base sm:text-xl text-white font-light leading-relaxed mt-4 max-w-2xl mx-auto">
                      {featuredArticle.excerpt || featuredArticle.subtitle}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Mobile Text Content (Aeon style: displayed below image) */}
              <div className="block sm:hidden py-6 px-1 space-y-3 bg-white text-left">
                <div className="text-xs font-mono uppercase tracking-widest text-editorial-gold font-bold">
                  {getDisplayType(featuredArticle.type)} / {featuredArticle.category}
                </div>
                <h2 className="font-serif text-2xl font-extrabold text-editorial-charcoal leading-snug tracking-tight">
                  {featuredArticle.title}
                </h2>
                <p className="font-serif text-sm text-editorial-gray leading-relaxed font-light line-clamp-3">
                  {featuredArticle.excerpt || featuredArticle.subtitle}
                </p>
                <div className="text-xs font-mono uppercase tracking-wider text-editorial-charcoal font-semibold">
                  By {featuredArticle.authorName}
                </div>
              </div>
            </section>
          )}

          {/* Rest of the homepage content inside layout-restricted container */}
          <div className="px-4 sm:px-16 lg:px-24 pb-12 sm:pb-20 mt-6 sm:mt-24">
            <div className="space-y-8 sm:space-y-16">

            {/* 2. LATEST ARTICLES GRID */}
            {latestArticles.filter((a) => a.id !== featuredArticle?.id).length > 0 && (
              <section className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {latestArticles
                    .filter((a) => a.id !== featuredArticle?.id)
                    .slice(0, 6)
                    .map((art) => (
                      <ArticleCard key={art.slug} article={art} variant="vertical" />
                    ))}
                </div>
              </section>
            )}




          </div>
        </div>
      </div>
    )}
  </div>
  );
}
