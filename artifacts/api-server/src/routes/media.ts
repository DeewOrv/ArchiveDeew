import { Router } from "express";
import { db } from "@workspace/db";
import { mediaTable } from "@workspace/db";
import { eq, and, or, ilike, desc, asc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function generateAcronym(title: string): string {
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length === 1) return words[0].substring(0, 4).toUpperCase();
  return words.map((w) => w[0]).join("").toUpperCase();
}

function requireAuth(req: any, res: any): string | null {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return req.user.id as string;
}

// GET /api/media/stats
router.get("/media/stats", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const items = await db
      .select()
      .from(mediaTable)
      .where(eq(mediaTable.user_id, userId));

    const stats: Record<string, number> = {};
    items.forEach((item) => {
      stats[item.category] = (stats[item.category] || 0) + 1;
    });

    res.json({
      total: items.length,
      reading: items.filter((i) => i.my_status === "Reading").length,
      watching: items.filter((i) => i.my_status === "Watching").length,
      completed: items.filter((i) => i.my_status === "Completed").length,
      dropped: items.filter((i) => i.my_status === "Dropped").length,
      on_hold: items.filter((i) => i.my_status === "On Hold").length,
      favorites: items.filter((i) => i.favorite).length,
      by_category: stats,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/media/recent
router.get("/media/recent", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const limit = parseInt(String(req.query.limit || "10"), 10);
  try {
    const items = await db
      .select()
      .from(mediaTable)
      .where(eq(mediaTable.user_id, userId))
      .orderBy(desc(mediaTable.updated_at))
      .limit(limit);
    res.json(items);
  } catch (err) {
    logger.error({ err }, "Failed to get recent media");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/media/favorites
router.get("/media/favorites", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const items = await db
      .select()
      .from(mediaTable)
      .where(and(eq(mediaTable.user_id, userId), eq(mediaTable.favorite, true)))
      .orderBy(desc(mediaTable.updated_at));
    res.json(items);
  } catch (err) {
    logger.error({ err }, "Failed to get favorites");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/media/continue-reading
router.get("/media/continue-reading", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const items = await db
      .select()
      .from(mediaTable)
      .where(
        and(
          eq(mediaTable.user_id, userId),
          eq(mediaTable.my_status, "Reading"),
        ),
      )
      .orderBy(desc(mediaTable.updated_at))
      .limit(10);
    res.json(items);
  } catch (err) {
    logger.error({ err }, "Failed to get continue reading");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/media/continue-watching
router.get("/media/continue-watching", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const items = await db
      .select()
      .from(mediaTable)
      .where(
        and(
          eq(mediaTable.user_id, userId),
          eq(mediaTable.my_status, "Watching"),
        ),
      )
      .orderBy(desc(mediaTable.updated_at))
      .limit(10);
    res.json(items);
  } catch (err) {
    logger.error({ err }, "Failed to get continue watching");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/media/export
router.get("/media/export", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const items = await db
      .select()
      .from(mediaTable)
      .where(eq(mediaTable.user_id, userId))
      .orderBy(asc(mediaTable.title));
    res.json(items);
  } catch (err) {
    logger.error({ err }, "Failed to export");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/media/import
router.post("/media/import", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const { items } = req.body as { items: any[] };
  if (!Array.isArray(items)) {
    res.status(400).json({ error: "items must be an array" });
    return;
  }
  let imported = 0;
  let skipped = 0;
  for (const item of items) {
    try {
      if (!item.title || !item.category) {
        skipped++;
        continue;
      }
      const acronym =
        item.acronym || generateAcronym(item.title);
      await db.insert(mediaTable).values({
        user_id: userId,
        title: item.title,
        alternative_title: item.alternative_title || null,
        acronym,
        cover_url: item.cover_url || null,
        category: item.category,
        media_status: item.media_status || null,
        progress: item.progress || 0,
        my_status: item.my_status || "Not Started",
        last_source: item.last_source || null,
        favorite: item.favorite || false,
        notes: item.notes || null,
      });
      imported++;
    } catch {
      skipped++;
    }
  }
  res.json({ imported, skipped });
});

// GET /api/media
router.get("/media", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { category, my_status, favorite, search, sort } = req.query as Record<string, string>;

    let conditions = [eq(mediaTable.user_id, userId)];

    if (category && category !== "All") {
      conditions.push(eq(mediaTable.category, category));
    }
    if (my_status) {
      conditions.push(eq(mediaTable.my_status, my_status));
    }
    if (favorite === "true") {
      conditions.push(eq(mediaTable.favorite, true));
    }

    let query = db
      .select()
      .from(mediaTable)
      .where(and(...conditions));

    // Apply search
    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      const items = await db
        .select()
        .from(mediaTable)
        .where(
          and(
            eq(mediaTable.user_id, userId),
            or(
              ilike(mediaTable.title, searchTerm),
              ilike(mediaTable.alternative_title, searchTerm),
              ilike(mediaTable.acronym, searchTerm),
            ),
          ),
        )
        .orderBy(desc(mediaTable.updated_at));
      res.json(items);
      return;
    }

    let items: any[];
    if (sort === "alpha") {
      items = await db
        .select()
        .from(mediaTable)
        .where(and(...conditions))
        .orderBy(asc(mediaTable.title));
    } else if (sort === "progress") {
      items = await db
        .select()
        .from(mediaTable)
        .where(and(...conditions))
        .orderBy(desc(mediaTable.progress));
    } else {
      items = await db
        .select()
        .from(mediaTable)
        .where(and(...conditions))
        .orderBy(desc(mediaTable.updated_at));
    }

    res.json(items);
  } catch (err) {
    logger.error({ err }, "Failed to list media");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/media
router.post("/media", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const body = req.body;
    if (!body.title || !body.category) {
      res.status(400).json({ error: "title and category are required" });
      return;
    }
    const acronym = body.acronym || generateAcronym(body.title);
    const [item] = await db
      .insert(mediaTable)
      .values({
        user_id: userId,
        title: body.title,
        alternative_title: body.alternative_title || null,
        acronym,
        cover_url: body.cover_url || null,
        category: body.category,
        media_status: body.media_status || null,
        progress: body.progress ?? 0,
        my_status: body.my_status || "Not Started",
        last_source: body.last_source || null,
        favorite: body.favorite || false,
        notes: body.notes || null,
      })
      .returning();
    res.status(201).json(item);
  } catch (err) {
    logger.error({ err }, "Failed to create media");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/media/:id
router.get("/media/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const id = parseInt(req.params.id, 10);
  try {
    const [item] = await db
      .select()
      .from(mediaTable)
      .where(and(eq(mediaTable.id, id), eq(mediaTable.user_id, userId)));
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(item);
  } catch (err) {
    logger.error({ err }, "Failed to get media");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/media/:id
router.patch("/media/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const id = parseInt(req.params.id, 10);
  try {
    const body = req.body;
    if (body.title && !body.acronym) {
      body.acronym = generateAcronym(body.title);
    }
    const [item] = await db
      .update(mediaTable)
      .set({ ...body, updated_at: new Date() })
      .where(and(eq(mediaTable.id, id), eq(mediaTable.user_id, userId)))
      .returning();
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(item);
  } catch (err) {
    logger.error({ err }, "Failed to update media");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/media/:id
router.delete("/media/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const id = parseInt(req.params.id, 10);
  try {
    const [item] = await db
      .delete(mediaTable)
      .where(and(eq(mediaTable.id, id), eq(mediaTable.user_id, userId)))
      .returning();
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete media");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/media/:id/progress
router.patch("/media/:id/progress", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const id = parseInt(req.params.id, 10);
  try {
    const { delta, set: setAbsolute } = req.body as {
      delta: number;
      set?: boolean;
    };
    const [existing] = await db
      .select()
      .from(mediaTable)
      .where(and(eq(mediaTable.id, id), eq(mediaTable.user_id, userId)));
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const newProgress = setAbsolute
      ? Math.max(0, delta)
      : Math.max(0, (existing.progress || 0) + delta);
    const [item] = await db
      .update(mediaTable)
      .set({ progress: newProgress, updated_at: new Date() })
      .where(and(eq(mediaTable.id, id), eq(mediaTable.user_id, userId)))
      .returning();
    res.json(item);
  } catch (err) {
    logger.error({ err }, "Failed to update progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/media/:id/favorite
router.patch("/media/:id/favorite", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const id = parseInt(req.params.id, 10);
  try {
    const [existing] = await db
      .select()
      .from(mediaTable)
      .where(and(eq(mediaTable.id, id), eq(mediaTable.user_id, userId)));
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const [item] = await db
      .update(mediaTable)
      .set({ favorite: !existing.favorite, updated_at: new Date() })
      .where(and(eq(mediaTable.id, id), eq(mediaTable.user_id, userId)))
      .returning();
    res.json(item);
  } catch (err) {
    logger.error({ err }, "Failed to toggle favorite");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
