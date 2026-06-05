import { useEffect, useRef } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetMediaStats, useGetContinueReading, useGetContinueWatching, useGetRecentMedia, getGetMediaStatsQueryKey, getGetContinueReadingQueryKey, getGetContinueWatchingQueryKey, getGetRecentMediaQueryKey, getListMediaQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { MediaCard } from "@/components/media-card";
import { Search, ChevronRight, BookOpen, Tv, CheckCircle2, Heart, Library } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const seededRef = useRef(false);

  const { data: stats, isLoading: statsLoading } = useGetMediaStats();
  const { data: reading, isLoading: readingLoading } = useGetContinueReading();
  const { data: watching, isLoading: watchingLoading } = useGetContinueWatching();
  const { data: recent, isLoading: recentLoading } = useGetRecentMedia({ limit: 6 });

  // Auto-seed initial data for first-time users
  useEffect(() => {
    if (!user || seededRef.current) return;
    seededRef.current = true;

    fetch("/api/seed", { method: "POST", credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.seeded > 0) {
          queryClient.invalidateQueries({ queryKey: getGetMediaStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetContinueReadingQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetContinueWatchingQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentMediaQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListMediaQueryKey() });
        }
      })
      .catch(() => {});
  }, [user]);

  const statCards = stats
    ? [
        { label: "Total", value: stats.total, icon: Library, color: "text-violet-400" },
        { label: "Reading", value: stats.reading, icon: BookOpen, color: "text-emerald-400" },
        { label: "Watching", value: stats.watching, icon: Tv, color: "text-blue-400" },
        { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-slate-400" },
        { label: "Favorites", value: stats.favorites, icon: Heart, color: "text-rose-400" },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6 p-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/10 shrink-0">
            <img src="/logo.png" alt="ArchiveDeew" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">ArchiveDeew</h1>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">
              {user?.firstName || user?.email?.split("@")[0] || "Your Archive"}
            </p>
          </div>
        </div>
        <Link
          href="/search"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary/60 text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <Search className="w-5 h-5" />
        </Link>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-5 gap-2">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-card border border-card-border rounded-xl p-2 flex flex-col items-center justify-center text-center gap-1"
            >
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className="text-xl font-bold leading-none">{value}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none">{label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Continue Reading */}
      {readingLoading ? (
        <SectionSkeleton />
      ) : reading && reading.length > 0 ? (
        <section>
          <SectionHeader title="Continue Reading" href="/library?my_status=Reading" />
          <div className="flex flex-col gap-3">
            {reading.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Continue Watching */}
      {watchingLoading ? (
        <SectionSkeleton />
      ) : watching && watching.length > 0 ? (
        <section>
          <SectionHeader title="Continue Watching" href="/library?my_status=Watching" />
          <div className="flex flex-col gap-3">
            {watching.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Recently Updated */}
      {recentLoading ? (
        <SectionSkeleton />
      ) : recent && recent.length > 0 ? (
        <section>
          <SectionHeader title="Recently Updated" href="/library" />
          <div className="flex flex-col gap-3">
            {recent.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Empty state */}
      {!statsLoading && stats && stats.total === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Library className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Start Your Collection</h2>
            <p className="text-muted-foreground text-sm mt-1">Track everything you read and watch</p>
          </div>
          <Link
            href="/add"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Add First Media
          </Link>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold">{title}</h2>
      <Link href={href} className="text-xs text-primary flex items-center gap-0.5 hover:opacity-80 transition-opacity">
        See all <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}
