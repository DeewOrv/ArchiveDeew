import { cn } from "@/lib/utils";
import { getCategoryGradient } from "@/lib/constants";

interface CoverImageProps {
  url?: string | null;
  acronym?: string | null;
  category: string;
  className?: string;
  containerClassName?: string;
}

export function CoverImage({ url, acronym, category, className, containerClassName }: CoverImageProps) {
  if (url) {
    return (
      <div className={cn("overflow-hidden bg-muted", containerClassName)}>
        <img 
          src={url} 
          alt={acronym || category} 
          className={cn("w-full h-full object-cover transition-all", className)} 
          loading="lazy"
        />
      </div>
    );
  }

  const gradient = getCategoryGradient(category);

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-2 text-center overflow-hidden bg-gradient-to-br",
      gradient,
      containerClassName
    )}>
      <span className="text-white font-bold tracking-tight text-opacity-90 drop-shadow-md text-2xl truncate w-full">
        {acronym || "?"}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-white/70 font-medium mt-1 truncate w-full">
        {category}
      </span>
    </div>
  );
}
