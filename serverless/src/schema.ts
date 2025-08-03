import { z } from "zod";

// User schemas
export const insertUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
});

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  name: z.string(),
  onboardingCompleted: z.boolean().default(false),
  createdAt: z.string(),
});

// Sleep Profile schemas
export const insertSleepProfileSchema = z.object({
  userId: z.string(),
  bedtime: z.string(),
  wakeTime: z.string(),
  preferredDuration: z.number(),
  soundPreferences: z.array(z.string()).default([]),
  sleepEnvironment: z.string().optional(),
  stressLevel: z.number().optional(),
  sleepIssues: z.array(z.string()).default([]),
});

export const sleepProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bedtime: z.string(),
  wakeTime: z.string(),
  preferredDuration: z.number(),
  soundPreferences: z.array(z.string()),
  sleepEnvironment: z.string().optional(),
  stressLevel: z.number().optional(),
  sleepIssues: z.array(z.string()),
  updatedAt: z.string(),
});

// Sleep Session schemas
export const insertSleepSessionSchema = z.object({
  userId: z.string(),
  startTime: z.date(),
  endTime: z.date().nullable().optional(),
  duration: z.number().optional(),
  quality: z.number().optional(),
  deepSleep: z.number().optional(),
  lightSleep: z.number().optional(),
  remSleep: z.number().optional(),
  audioUsed: z.string().optional(),
  notes: z.string().optional(),
});

export const sleepSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  startTime: z.date(),
  endTime: z.date().nullable(),
  duration: z.number().optional(),
  quality: z.number().optional(),
  deepSleep: z.number().optional(),
  lightSleep: z.number().optional(),
  remSleep: z.number().optional(),
  audioUsed: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
});

export const generatedAudioSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  prompt: z.string(),
  elevenLabsVoiceId: z.string().optional(),
  audioUrl: z.string().optional(),
  duration: z.number().optional(),
  isFavorite: z.boolean(),
  playCount: z.number(),
  createdAt: z.string(),
});

// Chat Message schemas
export const insertChatMessageSchema = z.object({
  userId: z.string(),
  role: z.string(),
  content: z.string(),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  role: z.string(),
  content: z.string(),
  timestamp: z.string(),
});

export const audioTrackSchema = z.object({
  type: z.string(),
  weight: z.number().min(0).max(1),
  duration: z.number().optional(),
  audioUrl: z.string().optional(),
});

// Generated Audio schemas
export const insertGeneratedAudioSchema = z.object({
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  prompt: z.string().optional(),
  elevenLabsVoiceId: z.string().optional(),
  audioUrl: z.string().optional(),
  duration: z.number().optional(),
  tracks: z.array(audioTrackSchema).optional(),
  chronotype: z.string().optional(),
  persona: z.string().optional(),
  soundPreferences: z.object({
    gentleMusic: z.enum(['like', 'neutral', 'dislike']).optional(),
    natureSounds: z.enum(['like', 'neutral', 'dislike']).optional(),
    whisperingVoice: z.enum(['like', 'neutral', 'dislike']).optional(),
    whiteNoise: z.enum(['like', 'neutral', 'dislike']).optional(),
  }).optional(),
});

export const selectGeneratedAudioSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  prompt: z.string().nullable(),
  audioUrl: z.string().nullable(),
  duration: z.number().nullable(),
  // New fields
  tracks: z.array(audioTrackSchema).nullable(),
  chronotype: z.string().nullable(),
  persona: z.string().nullable(),
  soundPreferences: z.object({
    gentleMusic: z.enum(['like', 'neutral', 'dislike']).optional(),
    natureSounds: z.enum(['like', 'neutral', 'dislike']).optional(),
    whisperingVoice: z.enum(['like', 'neutral', 'dislike']).optional(),
    whiteNoise: z.enum(['like', 'neutral', 'dislike']).optional(),
  }).nullable(),
  playCount: z.number(),
  isFavorite: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Personalized Audio Request schema
export const personalizedAudioRequestSchema = z.object({
  userId: z.string(),
  chronotype: z.string(),
  persona: z.string(),
  soundPreferences: z.object({
    gentleMusic: z.enum(['like', 'neutral', 'dislike']).optional(),
    natureSounds: z.enum(['like', 'neutral', 'dislike']).optional(),
    whisperingVoice: z.enum(['like', 'neutral', 'dislike']).optional(),
    whiteNoise: z.enum(['like', 'neutral', 'dislike']).optional(),
  }).optional(),
});

// Types inferred from schemas
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SleepProfile = z.infer<typeof sleepProfileSchema>;
export type InsertSleepProfile = z.infer<typeof insertSleepProfileSchema>;

export type SleepSession = z.infer<typeof sleepSessionSchema>;
export type InsertSleepSession = z.infer<typeof insertSleepSessionSchema>;

export type GeneratedAudio = z.infer<typeof generatedAudioSchema>;
export type InsertGeneratedAudio = z.infer<typeof insertGeneratedAudioSchema>;

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type AudioTrack = z.infer<typeof audioTrackSchema>;
export type SelectGeneratedAudio = z.infer<typeof selectGeneratedAudioSchema>;
export type PersonalizedAudioRequest = z.infer<typeof personalizedAudioRequestSchema>;