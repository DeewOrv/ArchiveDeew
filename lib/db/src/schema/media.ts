import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mediaTable = pgTable("media", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  title: text("title").notNull(),
  alternative_title: text("alternative_title"),
  acronym: text("acronym"),
  cover_url: text("cover_url"),
  category: text("category").notNull(),
  media_status: text("media_status"),
  progress: integer("progress").default(0),
  my_status: text("my_status").default("Not Started"),
  last_source: text("last_source"),
  favorite: boolean("favorite").default(false).notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMediaSchema = createInsertSchema(mediaTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type MediaItem = typeof mediaTable.$inferSelect;
