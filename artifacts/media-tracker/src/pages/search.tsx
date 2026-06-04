import { useState } from "react";
import { useListMedia } from "@workspace/api-client-react";
import { MediaCard } from "@/components/media-card";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function Search() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: media, isLoading } = useListMedia(
    { search: debouncedSearch },
    { query: { enabled: debouncedSearch.length > 0, queryKey: ["listMedia", { search: debouncedSearch }] } }
  );

  return (
    <div className="flex flex-col p-4 h-full">
      <div className="sticky top-0 bg-background pt-2 pb-4 z-10">
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            autoFocus
            placeholder="Title or acronym..." 
            className="pl-10 h-12 text-base rounded-xl bg-secondary/30 border-secondary"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 mt-2">
        {debouncedSearch.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Type to start searching...
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : media && media.length > 0 ? (
          media.map(item => <MediaCard key={item.id} item={item} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No matching media found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
