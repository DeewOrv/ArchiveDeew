import { MediaForm } from "@/components/media-form";

export default function AddMedia() {
  return (
    <div className="flex flex-col p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Add Media</h1>
      <MediaForm />
    </div>
  );
}
