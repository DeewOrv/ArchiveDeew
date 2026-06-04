import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../lib/logger";

const router = Router();

const CATEGORY_FOLDER_MAP: Record<string, string> = {
  Anime: "anime",
  Donghua: "donghua",
  Manga: "manga",
  Manhwa: "manhwa",
  Manhua: "manhua",
  Novel: "novel",
  "Light Novel": "light-novel",
  "Web Novel": "web-novel",
  Movie: "movie",
  KDrama: "kdrama",
  CDrama: "cdrama",
  JDrama: "jdrama",
  "Short Drama": "short-drama",
};

// POST /api/upload/cover
router.post("/upload/cover", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(503).json({ error: "Supabase storage not configured" });
    return;
  }

  try {
    const { category, filename } = req.body as {
      category: string;
      filename: string;
    };

    if (!category || !filename) {
      res.status(400).json({ error: "category and filename are required" });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const folder = CATEGORY_FOLDER_MAP[category] || "other";
    const ext = filename.split(".").pop()?.toLowerCase() || "webp";
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const path = `covers/${folder}/${safeName}`;

    const { data, error } = await supabase.storage
      .from("covers")
      .createSignedUploadUrl(path);

    if (error || !data) {
      logger.error({ error }, "Failed to create signed upload URL");
      res.status(500).json({ error: "Failed to create upload URL" });
      return;
    }

    const publicUrl = supabase.storage.from("covers").getPublicUrl(path).data
      .publicUrl;

    res.json({
      upload_url: data.signedUrl,
      public_url: publicUrl,
      path,
    });
  } catch (err) {
    logger.error({ err }, "Upload error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
