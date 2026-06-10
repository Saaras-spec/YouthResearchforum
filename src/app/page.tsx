import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getArticles, getFeaturedArticle, DEFAULT_PLACEHOLDER_IMAGE } from "@/lib/db";
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
          {/* 1. HERO FEATURED ARTICLE SECTION - Full Bleed 100vw */}
          {featuredArticle && (
            <section className="relative mx-3 sm:mx-8 lg:mx-10 mt-4 h-[50vh] sm:h-[70vh] overflow-hidden group cursor-pointer">
              <Link href={`/article/${featuredArticle.slug}`} className="absolute inset-0 block w-full h-full">
                {/* Background Image Container */}
                <div className="absolute inset-0 w-full h-full bg-[#f4f4f4]">
                  <Image
                    src={featuredArticle.coverImage || DEFAULT_PLACEHOLDER_IMAGE}
                    alt={featuredArticle.title}
                    fill
                    sizes="100vw"
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-102"
                    priority
                  />
                </div>
                
                {/* Dark Overlay (explicitly rgba(0, 0, 0, 0.35)) */}
                <div className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-90" style={{ backgroundColor: "rgba(0, 0, 0, 0.35)" }} />
                
                {/* Immersive Text Overlay (Centered) */}
                <div className="absolute inset-0 flex items-start justify-center text-center p-4 sm:p-12 md:p-16 z-10 pt-8 sm:pt-16">
                  <div className="max-w-3xl px-2 sm:px-4 flex flex-col items-center justify-center text-center w-full">
                    <h1 className="font-serif text-xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-md tracking-tight select-none text-center">
                      {featuredArticle.title}
                    </h1>
                    <p className="font-serif text-xs sm:text-base md:text-xl text-white font-light leading-relaxed mt-2.5 sm:mt-4 max-w-2xl mx-auto line-clamp-3 sm:line-clamp-none">
                      {featuredArticle.excerpt || featuredArticle.subtitle}
                    </p>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Rest of the homepage content inside layout-restricted container */}
          <div className="px-4 sm:px-16 lg:px-24 pb-12 sm:pb-20 mt-12 sm:mt-24">
            <div className="space-y-16">

            {/* 2. LATEST ARTICLES GRID */}
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

            {/* 3. MIDDLE NEWSLETTER BANNER */}
            <section className="bg-editorial-charcoal text-white p-8 sm:p-12 text-center relative overflow-hidden rounded-sm">
              <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-editorial-accent px-2.5 py-1 rounded-sm text-white font-bold">
                  Newsletter
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight">
                  Enter the debate. Sign up for our weekly digests.
                </h2>
                <p className="text-sm text-gray-300 font-light leading-relaxed">
                  Join a community of thousands of academics, researchers, and public intellectuals receiving our top reviews.
                </p>
                <div className="pt-2">
                  <Link
                    href="#subscribe"
                    className="inline-block bg-white text-editorial-charcoal hover:bg-editorial-accent hover:text-white uppercase text-xs tracking-widest font-bold px-6 py-3.5 transition-all rounded-sm cursor-pointer"
                  >
                    Subscribe Below
                  </Link>
                </div>
              </div>
              {/* Subtle background graphics */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full border-4 border-white" />
                <div className="absolute -bottom-12 -right-12 w-96 h-96 rounded-full border-4 border-white" />
              </div>
            </section>


          </div>
        </div>
      </div>
    )}
  </div>
  );
}
