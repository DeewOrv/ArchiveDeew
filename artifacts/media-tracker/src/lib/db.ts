import { supabase } from "./supabase";

export interface Media {
  id: number;
  user_id: string;
  title: string;
  alternative_title: string | null;
  acronym: string | null;
  cover_url: string | null;
  category: string;
  media_status: string | null;
  progress: number;
  my_status: string;
  last_source: string | null;
  favorite: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

export type MediaInput = Omit<Media, "id" | "user_id" | "created_at" | "updated_at">;

function generateAcronym(title: string): string {
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length === 1) return words[0].substring(0, 4).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .substring(0, 4);
}

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function getMedia(id: number): Promise<Media> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Media;
}

export async function listMedia(params: {
  search?: string;
  category?: string;
  my_status?: string;
  favorite?: boolean;
  sort?: string;
}): Promise<Media[]> {
  let query = supabase.from("media").select("*");

  if (params.search) {
    const s = params.search.replace(/[%_]/g, "\\$&");
    query = query.or(
      `title.ilike.%${s}%,alternative_title.ilike.%${s}%,acronym.ilike.%${s}%`
    );
  }
  if (params.category) query = query.eq("category", params.category);
  if (params.my_status) query = query.eq("my_status", params.my_status);
  if (params.favorite !== undefined) query = query.eq("favorite", params.favorite);

  if (params.sort === "alpha") {
    query = query.order("title", { ascending: true });
  } else if (params.sort === "progress") {
    query = query.order("progress", { ascending: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Media[];
}

export async function createMedia(
  input: Partial<MediaInput>
): Promise<Media> {
  const uid = await getUserId();
  const acronym =
    input.acronym ||
    (input.title ? generateAcronym(input.title) : null);

  const { data, error } = await supabase
    .from("media")
    .insert({
      user_id: uid,
      title: input.title ?? "",
      alternative_title: input.alternative_title ?? null,
      acronym,
      cover_url: input.cover_url ?? null,
      category: input.category ?? "Anime",
      media_status: input.media_status ?? "Ongoing",
      progress: input.progress ?? 0,
      my_status: input.my_status ?? "Not Started",
      last_source: input.last_source ?? null,
      favorite: input.favorite ?? false,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Media;
}

export async function updateMedia(
  id: number,
  input: Partial<MediaInput>
): Promise<Media> {
  const { data, error } = await supabase
    .from("media")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Media;
}

export async function deleteMedia(id: number): Promise<void> {
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProgress(id: number, delta: number): Promise<Media> {
  const current = await getMedia(id);
  const newProgress = Math.max(0, (current.progress ?? 0) + delta);
  return updateMedia(id, { progress: newProgress });
}

export async function toggleFavorite(id: number): Promise<Media> {
  const current = await getMedia(id);
  return updateMedia(id, { favorite: !current.favorite });
}

export async function getStats(): Promise<Stats> {
  const { data, error } = await supabase
    .from("media")
    .select("my_status, category, favorite");
  if (error) throw error;
  const items = data ?? [];

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const item of items) {
    const s = item.my_status ?? "Unknown";
    byStatus[s] = (byStatus[s] ?? 0) + 1;

    const c = item.category ?? "Unknown";
    byCategory[c] = (byCategory[c] ?? 0) + 1;
  }

  // Count favorites as a virtual status entry
  byStatus["Favorites"] = items.filter((i) => i.favorite).length;

  return { total: items.length, byStatus, byCategory };
}

export async function getRecentMedia(limit = 10): Promise<Media[]> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Media[];
}

export async function getContinueReading(): Promise<Media[]> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("my_status", "Reading")
    .order("updated_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as Media[];
}

export async function getContinueWatching(): Promise<Media[]> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("my_status", "Watching")
    .order("updated_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as Media[];
}

export async function getFavorites(): Promise<Media[]> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("favorite", true)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Media[];
}

export async function exportMedia(): Promise<Media[]> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .order("title", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Media[];
}

export async function importMedia(items: any[]): Promise<void> {
  const uid = await getUserId();

  const toInsert = items.map((item) => ({
    user_id: uid,
    title: item.title ?? "",
    alternative_title: item.alternative_title ?? null,
    acronym: item.acronym ?? null,
    cover_url: item.cover_url ?? null,
    category: item.category ?? "Anime",
    media_status: item.media_status ?? "Ongoing",
    progress: item.progress ?? 0,
    my_status: item.my_status ?? "Not Started",
    last_source: item.last_source ?? null,
    favorite: item.favorite ?? false,
    notes: item.notes ?? null,
  }));

  const { error } = await supabase
    .from("media")
    .upsert(toInsert, { onConflict: "user_id,title,category" });
  if (error) throw error;
}

const SEED_DATA = [
  { title: "Tensei shitara Slime Datta Ken S4", category: "Anime", media_status: "Ongoing", progress: 3, my_status: "Watching" },
  { title: "Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e S4", category: "Anime", media_status: "Ongoing", progress: 3, my_status: "Watching", acronym: "COTE" },
  { title: "One Piece", category: "Anime", media_status: "Ongoing", progress: 984, my_status: "Watching", acronym: "OP" },
  { title: "Battle Through the Heavens Season 5", category: "Donghua", media_status: "Ongoing", progress: 0, my_status: "Not Started", acronym: "BTTH" },
  { title: "Apotheosis", category: "Donghua", media_status: "Ongoing", progress: 18, my_status: "Watching" },
  { title: "Renegade Immortal", category: "Donghua", media_status: "Ongoing", progress: 0, my_status: "Not Started", acronym: "RI" },
  { title: "The 100th Regression of the Max-Level Player", category: "Manhwa", media_status: "Ongoing", progress: 86, my_status: "Reading" },
  { title: "The Return of the Crazy Demon", category: "Manhwa", media_status: "Ongoing", progress: 198, my_status: "Reading" },
  { title: "Absolute Dominion", category: "Manhwa", media_status: "Ongoing", progress: 63, my_status: "Reading" },
  { title: "Martial Peak", category: "Manhua", media_status: "Ongoing", progress: 1000, my_status: "Reading", acronym: "MP" },
  { title: "Your Name", category: "Movie", media_status: "Completed", progress: 0, my_status: "Completed", acronym: "YN" },
] as const;

export async function seedMedia(): Promise<number> {
  const uid = await getUserId();

  const { count } = await supabase
    .from("media")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) > 0) return 0;

  const toInsert = SEED_DATA.map((item) => ({
    user_id: uid,
    title: item.title,
    alternative_title: null,
    acronym: "acronym" in item ? item.acronym : generateAcronym(item.title),
    cover_url: null,
    category: item.category,
    media_status: item.media_status,
    progress: item.progress,
    my_status: item.my_status,
    last_source: null,
    favorite: false,
    notes: null,
  }));

  const { error } = await supabase.from("media").insert(toInsert);
  if (error) throw error;

  return toInsert.length;
}

export async function uploadCover(file: File, category: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${category}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from("covers")
    .upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}
