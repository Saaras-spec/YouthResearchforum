import { ArticleCardSkeleton } from "@/components/Skeletons";

export default function InternationalLoading() {
  return (
    <div className="min-h-screen py-12 bg-editorial-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header Skeleton */}
        <div className="border-b border-editorial-charcoal pb-8 mb-12 animate-pulse">
          <div className="h-4 w-16 bg-editorial-cream-dark rounded-sm mb-3" />
          <div className="h-12 w-80 bg-editorial-cream-dark rounded-sm mb-4" />
          <div className="h-5 w-96 bg-editorial-cream-dark rounded-sm" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </div>
      </div>
    </div>
  );
}
