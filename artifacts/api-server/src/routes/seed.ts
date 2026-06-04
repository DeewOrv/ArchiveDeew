import { Router } from "express";
import { db } from "@workspace/db";
import { mediaTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const SEED_DATA = [
  // Anime
  { title: "Tensei shitara Slime Datta Ken S4", category: "Anime", media_status: "Ongoing", progress: 3, my_status: "Watching" },
  { title: "Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e S4", category: "Anime", media_status: "Ongoing", progress: 3, my_status: "Watching", acronym: "COTE" },
  { title: "One Piece", category: "Anime", media_status: "Ongoing", progress: 984, my_status: "Watching", acronym: "OP" },
  // Donghua
  { title: "Battle Through the Heavens Season 5", category: "Donghua", media_status: "Ongoing", progress: 0, my_status: "Not Started", acronym: "BTTH" },
  { title: "Apotheosis", category: "Donghua", media_status: "Ongoing", progress: 18, my_status: "Watching" },
  { title: "Renegade Immortal", category: "Donghua", media_status: "Ongoing", progress: 0, my_status: "Not Started", acronym: "RI" },
  // Manhwa
  { title: "The 100th Regression of the Max-Level Player", category: "Manhwa", media_status: "Ongoing", progress: 86, my_status: "Reading" },
  { title: "The Return of the Crazy Demon", category: "Manhwa", media_status: "Ongoing", progress: 198, my_status: "Reading" },
  { title: "Absolute Dominion", category: "Manhwa", media_status: "Ongoing", progress: 63, my_status: "Reading" },
  // Manhua
  { title: "Martial Peak", category: "Manhua", media_status: "Ongoing", progress: 1000, my_status: "Reading", acronym: "MP" },
  // Movie
  { title: "Your Name", category: "Movie", media_status: "Completed", progress: 0, my_status: "Completed", acronym: "YN" },
];

function generateAcronym(title: string): string {
  const words = title.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 1) return words[0].substring(0, 4).toUpperCase();
  return words.map((w) => w[0]).join("").toUpperCase();
}

// POST /api/seed - seed initial data for user (only if they have 0 entries)
router.post("/seed", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user!.id as string;

  try {
    const [{ value: existingCount }] = await db
      .select({ value: count() })
      .from(mediaTable)
      .where(eq(mediaTable.user_id, userId));

    if (Number(existingCount) > 0) {
      res.json({ seeded: 0, message: "Already has data" });
      return;
    }

    let seeded = 0;
    for (const item of SEED_DATA) {
      await db.insert(mediaTable).values({
        user_id: userId,
        title: item.title,
        category: item.category,
        media_status: item.media_status,
        progress: item.progress,
        my_status: item.my_status,
        acronym: item.acronym || generateAcronym(item.title),
        favorite: false,
      });
      seeded++;
    }

    res.json({ seeded, message: "Seeded successfully" });
  } catch (err) {
    logger.error({ err }, "Seed failed");
    res.status(500).json({ error: "Seed failed" });
  }
});

export default router;
