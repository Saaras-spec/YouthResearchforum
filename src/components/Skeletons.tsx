import React from "react";

export function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col space-y-4 animate-pulse">
      {/* Cover Image Placeholder */}
      <div className="w-full aspect-[16/10] bg-editorial-cream-dark border border-[#e6e2da] rounded-sm" />
      
      {/* Category / Section Metadata */}
      <div className="h-4 bg-editorial-cream-dark w-24 rounded-sm" />
      
      {/* Title */}
      <div className="space-y-2">
        <div className="h-6 bg-editorial-cream-dark w-full rounded-sm" />
        <div className="h-6 bg-editorial-cream-dark w-4/5 rounded-sm" />
      </div>

      {/* Subtitle / Excerpt */}
      <div className="space-y-1.5 pt-1">
        <div className="h-4 bg-editorial-cream-dark w-full rounded-sm" />
        <div className="h-4 bg-editorial-cream-dark w-11/12 rounded-sm" />
      </div>

      {/* Author and Reading Time */}
      <div className="flex justify-between items-center pt-3 border-t border-[#e6e2da]/50">
        <div className="h-4 bg-editorial-cream-dark w-28 rounded-sm" />
        <div className="h-4 bg-editorial-cream-dark w-16 rounded-sm" />
      </div>
    </div>
  );
}

export function HeroArticleSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center animate-pulse py-6">
      {/* Cover Image */}
      <div className="lg:col-span-7 w-full aspect-[16/10] bg-editorial-cream-dark border border-[#e6e2da] rounded-sm" />
      
      {/* Content */}
      <div className="lg:col-span-5 space-y-6">
        <div className="space-y-2">
          <div className="h-4 bg-editorial-cream-dark w-28 rounded-sm" />
          <div className="h-10 bg-editorial-cream-dark w-full rounded-sm" />
          <div className="h-10 bg-editorial-cream-dark w-11/12 rounded-sm" />
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="h-4 bg-editorial-cream-dark w-full rounded-sm" />
          <div className="h-4 bg-editorial-cream-dark w-full rounded-sm" />
          <div className="h-4 bg-editorial-cream-dark w-3/4 rounded-sm" />
        </div>

        <div className="flex items-center space-x-4 pt-4 border-t border-[#e6e2da]">
          <div className="h-10 w-10 rounded-full bg-editorial-cream-dark" />
          <div className="space-y-2">
            <div className="h-4 bg-editorial-cream-dark w-24 rounded-sm" />
            <div className="h-3 bg-editorial-cream-dark w-32 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-10 py-10">
      {/* Category / Title / Subtitle */}
      <div className="max-w-3xl mx-auto text-center space-y-6 px-4">
        <div className="h-4 bg-editorial-cream-dark w-24 mx-auto rounded-sm" />
        <div className="space-y-3">
          <div className="h-10 bg-editorial-cream-dark w-full rounded-sm" />
          <div className="h-10 bg-editorial-cream-dark w-4/5 mx-auto rounded-sm" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-5 bg-editorial-cream-dark w-11/12 mx-auto rounded-sm" />
          <div className="h-5 bg-editorial-cream-dark w-9/12 mx-auto rounded-sm" />
        </div>
        <div className="h-4 bg-editorial-cream-dark w-48 mx-auto rounded-sm pt-4" />
      </div>

      {/* Hero Image */}
      <div className="max-w-5xl mx-auto w-full aspect-[21/9] bg-editorial-cream-dark border border-[#e6e2da] rounded-sm" />

      {/* Article Body */}
      <div className="max-w-2xl mx-auto px-4 space-y-6 pt-4">
        <div className="h-4 bg-editorial-cream-dark w-full rounded-sm" />
        <div className="h-4 bg-editorial-cream-dark w-full rounded-sm" />
        <div className="h-4 bg-editorial-cream-dark w-5/6 rounded-sm" />
        <div className="h-4 bg-editorial-cream-dark w-11/12 rounded-sm" />
        <div className="h-4 bg-editorial-cream-dark w-4/5 rounded-sm" />
        
        {/* Callout */}
        <div className="pl-6 border-l-4 border-[#e6e2da] py-4 space-y-2">
          <div className="h-6 bg-editorial-cream-dark w-full rounded-sm" />
          <div className="h-6 bg-editorial-cream-dark w-3/4 rounded-sm" />
        </div>

        <div className="h-4 bg-editorial-cream-dark w-full rounded-sm" />
        <div className="h-4 bg-editorial-cream-dark w-11/12 rounded-sm" />
      </div>
    </div>
  );
}
