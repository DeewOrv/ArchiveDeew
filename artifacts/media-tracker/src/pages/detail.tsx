import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as db from "@/lib/db";
import { CoverImage } from "@/components/cover-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Edit, Trash2, ChevronLeft, Loader2, ExternalLink, BookOpen, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SOURCE_URLS } from "@/lib/constants";

export default function Detail() {
  const [, params] = useRoute("/media/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: media, isLoading } = useQuery({
    queryKey: ["media", id],
    queryFn: () => db.getMedia(id),
    enabled: !!id,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["media"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const handleProgress = async (delta: number) => {
    if (!media) return;
    const newProgress = Math.max(0, (media.progress || 0) + delta);
    queryClient.setQueryData(["media", id], { ...media, progress: newProgress });
    await db.updateProgress(id, delta);
    invalidateAll();
  };

  const handleFavorite = async () => {
    if (!media) return;
    queryClient.setQueryData(["media", id], { ...media, favorite: !media.favorite });
    await db.toggleFavorite(id);
    invalidateAll();
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this?")) {
      await db.deleteMedia(id);
      invalidateAll();
      toast({ title: "Deleted successfully" });
      setLocation("/library");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!media) {
    return <div className="p-4 text-center mt-10">Media not found</div>;
  }

  return (
    <div className="flex flex-col pb-20 relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur"
          onClick={handleFavorite}
        >
          <Heart className={`w-5 h-5 ${media.favorite ? "fill-red-500 text-red-500" : ""}`} />
        </Button>
        <Link href={`/media/${id}/edit`}>
          <Button variant="secondary" size="icon" className="rounded-full bg-background/80 backdrop-blur">
            <Edit className="w-5 h-5" />
          </Button>
        </Link>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>

      <div className="w-full aspect-[3/4] max-h-[50vh] relative">
        <CoverImage
          url={media.cover_url}
          acronym={media.acronym}
          category={media.category}
          containerClassName="w-full h-full rounded-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4">
          <Badge className="mb-2 bg-primary text-primary-foreground">{media.category}</Badge>
          <h1 className="text-3xl font-bold leading-tight drop-shadow-md">{media.title}</h1>
          {media.alternative_title && (
            <p className="text-muted-foreground/90 font-medium text-sm mt-1">{media.alternative_title}</p>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Progress Controls */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">Progress</span>
            </div>
            <span className="text-2xl font-bold font-mono">{media.progress || 0}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" className="h-12 text-lg font-bold" onClick={() => handleProgress(-1)}>-1</Button>
            <Button variant="secondary" className="h-12 text-lg font-bold bg-primary/10 text-primary hover:bg-primary/20" onClick={() => handleProgress(1)}>+1</Button>
            <Button variant="secondary" className="h-12 text-lg font-bold bg-primary/10 text-primary hover:bg-primary/20" onClick={() => handleProgress(5)}>+5</Button>
            <Button variant="secondary" className="h-12 text-lg font-bold bg-primary/10 text-primary hover:bg-primary/20" onClick={() => handleProgress(10)}>+10</Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-xl p-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">My Status</span>
            <span className="font-medium">{media.my_status || "Not Started"}</span>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Release Status</span>
            <span className="font-medium">{media.media_status || "Ongoing"}</span>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 col-span-2 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Source</span>
              <span className="font-medium">{media.last_source || "Unknown"}</span>
            </div>
            {media.last_source && SOURCE_URLS[media.last_source] && (
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0 gap-1.5 text-primary border border-primary/20 bg-primary/10 hover:bg-primary/20"
                onClick={() =>
                  window.open(SOURCE_URLS[media.last_source!]!, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open
              </Button>
            )}
          </div>
        </div>

        {/* Notes */}
        {media.notes && (
          <div className="bg-secondary/20 rounded-xl p-4 border border-border/50">
            <h3 className="font-semibold mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{media.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-4">
          <Clock className="w-3 h-3" />
          <span>Last updated: {format(new Date(media.updated_at), "PPP p")}</span>
        </div>
      </div>
    </div>
  );
}
