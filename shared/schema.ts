import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sleepProfiles = pgTable("sleep_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bedtime: text("bedtime").notNull(), // e.g. "22:30"
  wakeTime: text("wake_time").notNull(), // e.g. "06:30"
  preferredDuration: integer("preferred_duration").notNull(), // minutes
  soundPreferences: json("sound_preferences").$type<string[]>().default([]), // ["nature", "white_noise", "asmr", "ambient"]
  sleepEnvironment: text("sleep_environment"), // "quiet", "city", "rural"
  stressLevel: integer("stress_level"), // 1-10 scale
  sleepIssues: json("sleep_issues").$type<string[]>().default([]), // ["trouble_falling_asleep", "frequent_waking", "early_waking"]
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sleepSessions = pgTable("sleep_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // minutes
  quality: integer("quality"), // 1-100 scale
  deepSleep: integer("deep_sleep"), // minutes
  lightSleep: integer("light_sleep"), // minutes
  remSleep: integer("rem_sleep"), // minutes
  audioUsed: text("audio_used"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedAudios = pgTable("generated_audios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "nature", "white_noise", "asmr", "ambient"
  prompt: text("prompt").notNull(),
  elevenLabsVoiceId: text("elevenlabs_voice_id"),
  audioUrl: text("audio_url"),
  duration: integer("duration"), // seconds
  isFavorite: boolean("is_favorite").default(false),
  playCount: integer("play_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSleepProfileSchema = createInsertSchema(sleepProfiles).omit({
  id: true,
  updatedAt: true,
});

export const insertSleepSessionSchema = createInsertSchema(sleepSessions).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedAudioSchema = createInsertSchema(generatedAudios).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SleepProfile = typeof sleepProfiles.$inferSelect;
export type InsertSleepProfile = z.infer<typeof insertSleepProfileSchema>;

export type SleepSession = typeof sleepSessions.$inferSelect;
export type InsertSleepSession = z.infer<typeof insertSleepSessionSchema>;

export type GeneratedAudio = typeof generatedAudios.$inferSelect;
export type InsertGeneratedAudio = z.infer<typeof insertGeneratedAudioSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
