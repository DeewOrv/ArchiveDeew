import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import * as db from "@/lib/db";
import { MediaForm } from "@/components/media-form";
import { Loader2 } from "lucide-react";

export default function EditMedia() {
  const [, params] = useRoute("/media/:id/edit");
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: media, isLoading } = useQuery({
    queryKey: ["media", id],
    queryFn: () => db.getMedia(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!media) {
    return <div className="p-4 text-center mt-10">Media not found</div>;
  }

  return (
    <div className="flex flex-col p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Edit Media</h1>
      <MediaForm initialData={media} />
    </div>
  );
}
