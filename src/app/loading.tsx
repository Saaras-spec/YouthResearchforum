import { HeroArticleSkeleton, ArticleCardSkeleton } from "@/components/Skeletons";

export default function HomeLoading() {
  return (
    <div className="min-h-screen py-8 bg-editorial-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Skeleton */}
        <HeroArticleSkeleton />

        {/* Latest Articles Grid Skeleton */}
        <div className="space-y-8">
          <div className="h-8 w-48 bg-editorial-cream-dark rounded-sm animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
