import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticlesBySection, Article, DEFAULT_PLACEHOLDER_IMAGE, getDisplayType } from "@/lib/db";
import CommentsSection from "@/components/CommentsSection";
import ArticleCard from "@/components/ArticleCard";
import ArticleActions from "@/components/ArticleActions";

export const revalidate = 0; // Live reload

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  
  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: article.title,
    description: article.subtitle,
    openGraph: {
      title: article.title,
      description: article.subtitle,
      type: "article",
      publishedTime: article.createdAt?.toDate ? article.createdAt.toDate().toISOString() : new Date().toISOString(),
      authors: [article.authorName],
      images: [
        {
          url: article.coverImage || "https://youthresearchforum.org/logo.jpg",
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
  };
}

// Inline Markdown Helper
function parseInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

// Custom Markdown Blocks Renderer — Aeon-style right column (no max-width, edge-to-edge)
function renderContent(content: string) {
  if (!content) return null;
  
  const blocks = content.split(/\n\s*\n/);
  
  return (
    <div className="rich-text text-editorial-charcoal">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("## ")) {
          const text = trimmed.substring(3).trim();
          return <h2 key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(text) }} />;
        }
        if (trimmed.startsWith("### ")) {
          const text = trimmed.substring(4).trim();
          return <h3 key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(text) }} />;
        }
        if (trimmed.startsWith("> ")) {
          const text = trimmed.substring(2).trim();
          return <blockquote key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(text) }} />;
        }
        if (trimmed.startsWith("- ")) {
          const items = trimmed
            .split(/\n\s*-\s+/)
            .map((item) => item.replace(/^- /, "").trim())
            .filter(Boolean);
          return (
            <ul key={idx}>
              {items.map((it, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(it) }} />
              ))}
            </ul>
          );
        }
        if (trimmed.startsWith("1. ")) {
          const items = trimmed
            .split(/\n\s*\d+\.\s+/)
            .map((item) => item.replace(/^\d+\.\s+/, "").trim())
            .filter(Boolean);
          return (
            <ol key={idx}>
              {items.map((it, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(it) }} />
              ))}
            </ol>
          );
        }

        // Parse markdown image blocks: ![caption](url)
        if (trimmed.startsWith("![") && trimmed.includes("](") && trimmed.endsWith(")")) {
          const match = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
          if (match) {
            const caption = match[1];
            const url = match[2];
            return (
              <figure key={idx} className="my-10 space-y-3 block-image">
                <div className="relative w-full overflow-hidden rounded-xs border border-[#e6e2da] bg-editorial-cream-dark/10">
                  <img
                    src={url}
                    alt={caption || "Article illustration"}
                    className="w-full h-auto object-cover max-h-[600px] mx-auto block"
                    loading="lazy"
                  />
                </div>
                {caption && (
                  <figcaption className="text-center text-xs text-editorial-gray italic font-sans max-w-2xl mx-auto leading-relaxed">
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          }
        }

        return <p key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed) }} />;
      })}
    </div>
  );
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Estimate word count
  const wordCount = article.content ? article.content.split(/\s+/).filter(Boolean).length : 0;

  // Fetch related articles (same section, excluding current)
  const allSectionArticles = await getArticlesBySection(article.section, 4);
  const relatedArticles = allSectionArticles
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <article className="min-h-screen bg-editorial-cream font-sans pb-16">
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — Full screen width cover image with overlaid text (Desktop) / Image only (Mobile)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full h-[40vh] sm:h-screen bg-editorial-charcoal overflow-hidden flex items-start justify-center -mt-[78px] sm:-mt-[92px] lg:-mt-[106px] pt-[110px] sm:pt-[130px] lg:pt-[140px]">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={article.coverImage || DEFAULT_PLACEHOLDER_IMAGE}
            alt={article.title}
            fill
            sizes="100vw"
            className="object-cover object-top animate-fade-in"
            priority
          />
        </div>

        {/* Desktop Overlay Text (Centered) */}
        <div className="hidden sm:block relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-12 md:px-16 space-y-6">
          <h1 
            className="text-3xl sm:text-5xl md:text-[4rem] font-bold text-white leading-[1.1] tracking-tight drop-shadow-md select-none"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            {article.title}
          </h1>
          
          <p 
            className="text-base sm:text-lg md:text-xl text-white/90 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-sm"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            {article.subtitle}
          </p>
        </div>
      </section>

      {/* Mobile Title & Metadata Section (Below Image) */}
      <div className="block sm:hidden bg-white px-4 pt-6 pb-2 text-left space-y-3">
        <div className="text-xs font-mono uppercase tracking-widest text-editorial-gold font-bold">
          {getDisplayType(article.type)} / {article.category}
        </div>
        <h1 
          className="text-2xl font-bold text-editorial-charcoal leading-snug tracking-tight"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          {article.title}
        </h1>
        <p 
          className="text-sm text-editorial-gray font-light leading-relaxed"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          {article.subtitle}
        </p>
        <div className="text-xs font-mono uppercase tracking-wider text-editorial-charcoal font-semibold pt-1">
          By {article.authorName}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT — Left sidebar + Right article body
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row w-full mt-10 lg:mt-14">

        {/* ─── LEFT COLUMN: Metadata Sidebar (~300px wide, generous 80px left margin) ─── */}
        <aside className="w-full lg:w-[300px] lg:ml-[80px] flex-shrink-0 px-4 sm:px-10 lg:px-0 py-8 lg:py-14 bg-editorial-cream">
          <div className="lg:sticky lg:top-20 flex flex-col">
            
            {/* 1. Author name as a clickable link */}
            <Link 
              href="#" 
              className="text-lg text-editorial-charcoal font-normal hover:underline"
            >
              {article.authorName}
            </Link>

            {/* 2. Short author bio text below the name */}
            <p className="text-sm text-editorial-gray mt-2 leading-relaxed font-sans font-light">
              {article.authorBio}
            </p>

            {/* Empty space */}
            <div className="h-8 lg:h-12" />

            {/* 3. 'Edited by [name]' on one line */}
            <p className="text-sm text-editorial-gray font-sans font-light">
              Edited by {(article as any).editedBy || "Srishti"}
            </p>
            {/* Word count on next line */}
            <p className="text-sm text-editorial-gray mt-1 font-sans font-light">
              {wordCount.toLocaleString()} words
            </p>

            {/* Empty space */}
            <div className="h-8 lg:h-12" />

            {/* 4. Category tags as plain underlined links, each on its own line */}
            <div className="flex flex-col space-y-2.5">
              {article.category && (
                <Link 
                  href={`/${article.section}`} 
                  className="underline text-sm text-editorial-charcoal hover:text-editorial-accent font-sans"
                >
                  {article.category}
                </Link>
              )}
              {article.section && article.section !== article.category && (
                <Link 
                  href={`/${article.section}`} 
                  className="underline text-sm text-editorial-charcoal hover:text-editorial-accent font-sans"
                >
                  {article.section === "national" ? "National" : "International"}
                </Link>
              )}
            </div>

            {/* Empty space */}
            <div className="h-8 lg:h-12" />

            {/* 5. A light grey button 'SYNDICATE THIS ARTICLE' in small caps */}
            <button className="bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 text-[11px] tracking-widest font-mono py-3 px-4 uppercase transition-colors w-full text-center cursor-pointer font-bold">
              SYNDICATE THIS {getDisplayType(article.type, true)}
            </button>
          </div>
        </aside>

        {/* ─── RIGHT COLUMN: Article Body (fills remaining space, starts right after left column, no divider) ─── */}
        <div className="flex-grow flex-1 min-w-0">
          <div className="px-4 sm:px-10 lg:pl-[50px] lg:pr-[60px] py-8 lg:py-14">
            
            {/* Render content without max-width restriction */}
            {renderContent(article.content)}

            {/* Save / Share Actions Bar */}
            <ArticleActions articleId={article.id!} articleSlug={article.slug} title={article.title} />

            {/* Comments Section */}
            <div className="mt-14 border-t border-[#e6e2da] pt-10">
              <CommentsSection articleId={article.id!} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RELATED ARTICLES — Bottom cards grid
          ═══════════════════════════════════════════════════════════════════ */}
      {relatedArticles.length > 0 && (
        <section className="mx-6 sm:mx-10 lg:mx-16 pt-12 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((art) => (
              <ArticleCard key={art.slug} article={art} variant="vertical" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
