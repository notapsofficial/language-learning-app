import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Vocabulary table for multilingual words
export const vocabulary = pgTable("vocabulary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  english: text("english").notNull(),
  japanese: text("japanese").notNull(),
  korean: text("korean"),
  french: text("french"),
  chinese: text("chinese"),
  pronunciation: text("pronunciation").notNull(), // IPA pronunciation
  meaning: text("meaning").notNull(), // Japanese meaning/description
  category: text("category").default("general"),
  difficulty: integer("difficulty").default(1), // 1-5 scale
  createdAt: timestamp("created_at").default(sql`now()`),
});

// User progress tracking
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vocabularyId: varchar("vocabulary_id").references(() => vocabulary.id).notNull(),
  learned: boolean("learned").default(false),
  difficult: boolean("difficult").default(false),
  correctCount: integer("correct_count").default(0),
  totalAttempts: integer("total_attempts").default(0),
  lastReviewed: timestamp("last_reviewed").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Pronunciation practice sessions
export const pronunciationSessions = pgTable("pronunciation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vocabularyId: varchar("vocabulary_id").references(() => vocabulary.id).notNull(),
  targetWord: text("target_word").notNull(),
  recognizedWord: text("recognized_word"),
  accuracy: integer("accuracy").default(0), // 0-100 percentage
  feedback: text("feedback"),
  language: text("language").default("en"), // Target language
  sessionDate: timestamp("session_date").default(sql`now()`),
});

// Learning achievements
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  requirement: text("requirement").notNull(),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// User settings and preferences
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dailyGoal: integer("daily_goal").default(20),
  notifications: boolean("notifications").default(true),
  autoplay: boolean("autoplay").default(false),
  theme: text("theme").default("auto"), // light, dark, auto
  appLanguage: text("app_language").default("ja"), // ja, en
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Learning statistics
export const learningStats = pgTable("learning_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").default(sql`now()`),
  wordsLearned: integer("words_learned").default(0),
  pronunciationMinutes: integer("pronunciation_minutes").default(0),
  streakDays: integer("streak_days").default(0),
  totalWords: integer("total_words").default(0),
  masteredWords: integer("mastered_words").default(0),
});

// Zod schemas
export const insertVocabularySchema = createInsertSchema(vocabulary).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
});

export const insertPronunciationSessionSchema = createInsertSchema(pronunciationSessions).omit({
  id: true,
  sessionDate: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
  unlockedAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLearningStatsSchema = createInsertSchema(learningStats).omit({
  id: true,
  date: true,
});

// Types
export type Vocabulary = typeof vocabulary.$inferSelect;
export type InsertVocabulary = z.infer<typeof insertVocabularySchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type PronunciationSession = typeof pronunciationSessions.$inferSelect;
export type InsertPronunciationSession = z.infer<typeof insertPronunciationSessionSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type LearningStats = typeof learningStats.$inferSelect;
export type InsertLearningStats = z.infer<typeof insertLearningStatsSchema>;

// Dashboard data type
export type DashboardData = {
  todayStats: {
    wordsLearned: number;
    pronunciationMinutes: number;
    streakDays: number;
  };
  recentAchievements: Achievement[];
  overallProgress: {
    totalWords: number;
    masteredWords: number;
    percentage: number;
  };
};

// Language progress type
export type LanguageProgress = {
  language: string;
  flag: string;
  name: string;
  words: number;
  progress: number;
  percentage: number;
};

// Weekly learning data
export type WeeklyData = {
  label: string;
  percentage: number;
  minutes: number;
}[];
