import { useState } from "react";
import { useListMedia } from "@workspace/api-client-react";
import { MediaCard } from "@/components/media-card";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, MY_STATUSES } from "@/lib/constants";
import { Link } from "wouter";

export default function Library() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  
  const [category, setCategory] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [sort, setSort] = useState("updated_at:desc");

  const { data: media, isLoading } = useListMedia({
    search: debouncedSearch || undefined,
    category,
    my_status: status,
    sort
  });

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-3 border-b border-border space-y-3">
        <h1 className="text-xl font-bold">Library</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search library..." 
            className="pl-9 h-10 bg-secondary/50 border-secondary"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-2 pb-2">
            <Badge 
              variant={!category ? "default" : "secondary"} 
              className="cursor-pointer"
              onClick={() => setCategory(undefined)}
            >
              All
            </Badge>
            {CATEGORIES.map(cat => (
              <Badge 
                key={cat}
                variant={category === cat ? "default" : "secondary"} 
                className="cursor-pointer"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
        
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-2 pb-2">
            <Badge 
              variant={!status ? "default" : "outline"} 
              className="cursor-pointer"
              onClick={() => setStatus(undefined)}
            >
              Any Status
            </Badge>
            {MY_STATUSES.map(stat => (
              <Badge 
                key={stat}
                variant={status === stat ? "default" : "outline"} 
                className="cursor-pointer"
                onClick={() => setStatus(stat)}
              >
                {stat}
              </Badge>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : media && media.length > 0 ? (
          media.map(item => <MediaCard key={item.id} item={item} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No media found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Try adjusting your filters or search query.
            </p>
            <Link href="/add">
              <Button>Add New Media</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
