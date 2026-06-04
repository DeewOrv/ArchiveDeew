import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { MediaInput } from "@workspace/api-client-react";
import { useCreateMedia, useUpdateMedia, useUploadCover, getGetMediaQueryKey, getListMediaQueryKey, getGetRecentMediaQueryKey, getGetContinueReadingQueryKey, getGetContinueWatchingQueryKey, getGetMediaStatsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES, MEDIA_STATUSES, MY_STATUSES, SOURCES, generateAcronym } from "@/lib/constants";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  alternative_title: z.string().optional(),
  acronym: z.string().optional(),
  cover_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  media_status: z.string().optional(),
  progress: z.coerce.number().min(0).default(0),
  my_status: z.string().optional(),
  last_source: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MediaFormProps {
  initialData?: any;
}

export function MediaForm({ initialData }: MediaFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const createMutation = useCreateMedia();
  const updateMutation = useUpdateMedia();
  const uploadMutation = useUploadCover();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      alternative_title: initialData?.alternative_title || "",
      acronym: initialData?.acronym || "",
      cover_url: initialData?.cover_url || "",
      category: initialData?.category || "Anime",
      media_status: initialData?.media_status || "Ongoing",
      progress: initialData?.progress || 0,
      my_status: initialData?.my_status || "Not Started",
      last_source: initialData?.last_source || "Other",
      notes: initialData?.notes || "",
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const category = form.getValues("category") || "Other";
      const result = await uploadMutation.mutateAsync({
        data: { category, filename: file.name }
      });

      await fetch(result.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      form.setValue("cover_url", result.public_url);
      toast({ title: "Cover uploaded successfully" });
    } catch (err) {
      toast({ title: "Failed to upload cover", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (values: FormData) => {
    try {
      if (!values.acronym && values.title) {
        values.acronym = generateAcronym(values.title);
      }

      const cleanData: any = { ...values };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === "") {
          cleanData[key] = undefined;
        }
      });

      let id = initialData?.id;

      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: cleanData });
        toast({ title: "Media updated" });
      } else {
        const result = await createMutation.mutateAsync({ data: cleanData as MediaInput });
        id = result.id;
        toast({ title: "Media created" });
      }

      if (initialData) {
        queryClient.invalidateQueries({ queryKey: getGetMediaQueryKey(initialData.id) });
      }
      queryClient.invalidateQueries({ queryKey: getListMediaQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRecentMediaQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetContinueReadingQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetContinueWatchingQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMediaStatsQueryKey() });

      setLocation(`/media/${id}`);
    } catch (error) {
      toast({ title: "Error saving media", variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="One Piece" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="alternative_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alternative Title</FormLabel>
              <FormControl>
                <Input placeholder="Wan Pīsu" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acronym"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acronym</FormLabel>
                <FormControl>
                  <Input placeholder="OP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="my_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>My Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MY_STATUSES.map(stat => (
                      <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Progress</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="media_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Release Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MEDIA_STATUSES.map(stat => (
                      <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SOURCES.map(src => (
                      <SelectItem key={src} value={src}>{src}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="cover_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="https://..." {...field} className="flex-1" />
                </FormControl>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  className="shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Any thoughts..." className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-semibold"
          disabled={createMutation.isPending || updateMutation.isPending || isUploading}
        >
          {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Media"}
        </Button>
      </form>
    </Form>
  );
}
