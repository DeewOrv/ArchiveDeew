import { Link } from "wouter";
import { CoverImage } from "./cover-image";
import { Badge } from "@/components/ui/badge";
import type { Media } from "@/lib/db";
import { Clock, CheckCircle2, PlayCircle, BookOpen, PauseCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MediaCardProps {
  item: Media;
}

const getStatusIcon = (status: string | null) => {
  switch (status) {
    case "Reading": return <BookOpen className="w-3 h-3 mr-1" />;
    case "Watching": return <PlayCircle className="w-3 h-3 mr-1" />;
    case "Completed": return <CheckCircle2 className="w-3 h-3 mr-1" />;
    case "On Hold": return <PauseCircle className="w-3 h-3 mr-1" />;
    case "Dropped": return <XCircle className="w-3 h-3 mr-1" />;
    default: return null;
  }
};

const getStatusColor = (status: string | null) => {
  switch (status) {
    case "Reading": return "text-emerald-500 bg-emerald-500/10";
    case "Watching": return "text-blue-500 bg-blue-500/10";
    case "Completed": return "text-primary bg-primary/10";
    case "On Hold": return "text-amber-500 bg-amber-500/10";
    case "Dropped": return "text-red-500 bg-red-500/10";
    default: return "text-muted-foreground bg-muted";
  }
};

export function MediaCard({ item }: MediaCardProps) {
  const updatedDate = new Date(item.updated_at);
  const timeAgo = formatDistanceToNow(updatedDate, { addSuffix: true });

  return (
    <Link
      href={`/media/${item.id}`}
      className="group flex gap-3 p-3 rounded-xl bg-card border border-card-border hover:border-primary/50 transition-all active:scale-[0.98]"
    >
      <CoverImage
        url={item.cover_url}
        acronym={item.acronym}
        category={item.category}
        containerClassName="w-20 h-28 shrink-0 rounded-md shadow-sm"
      />

      <div className="flex flex-col flex-1 min-w-0 py-0.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5 mt-auto mb-2">
          {item.my_status && item.my_status !== "Not Started" && (
            <Badge
              variant="secondary"
              className={`px-1.5 py-0 rounded text-[10px] font-medium border-none flex items-center ${getStatusColor(item.my_status)}`}
            >
              {getStatusIcon(item.my_status)}
              {item.my_status}
            </Badge>
          )}

          <Badge variant="outline" className="px-1.5 py-0 rounded text-[10px] font-medium text-muted-foreground border-border/50">
            {item.category}
          </Badge>

          {item.progress !== null && item.progress !== undefined && (
            <Badge variant="outline" className="px-1.5 py-0 rounded text-[10px] font-medium border-primary/20 text-primary bg-primary/5">
              Ch {item.progress}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-auto pt-1 border-t border-border/50">
          <span className="truncate max-w-[120px]">{item.last_source || "No source"}</span>
          <span className="flex items-center whitespace-nowrap shrink-0">
            <Clock className="w-3 h-3 mr-1 opacity-50" />
            {timeAgo}
          </span>
        </div>
      </div>
    </Link>
  );
}
