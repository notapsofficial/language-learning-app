import { 
  type Vocabulary, 
  type InsertVocabulary,
  type UserProgress,
  type InsertUserProgress,
  type PronunciationSession,
  type InsertPronunciationSession,
  type Achievement,
  type InsertAchievement,
  type UserSettings,
  type InsertUserSettings,
  type LearningStats,
  type InsertLearningStats,
  type DashboardData,
  type LanguageProgress,
  type WeeklyData,
  vocabulary,
  userProgress,
  pronunciationSessions,
  achievements,
  userSettings,
  learningStats
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, gte, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Vocabulary methods
  getVocabulary(): Promise<Vocabulary[]>;
  getVocabularyById(id: string): Promise<Vocabulary | undefined>;
  getVocabularyByLanguage(language: string): Promise<Vocabulary[]>;
  createVocabulary(vocabulary: InsertVocabulary): Promise<Vocabulary>;

  // User progress methods
  getUserProgress(): Promise<UserProgress[]>;
  getUserProgressByVocabularyId(vocabularyId: string): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: string, progress: Partial<UserProgress>): Promise<UserProgress>;

  // Pronunciation session methods
  getPronunciationSessions(): Promise<PronunciationSession[]>;
  createPronunciationSession(session: InsertPronunciationSession): Promise<PronunciationSession>;
  getTodayPronunciationSessions(): Promise<PronunciationSession[]>;

  // Achievement methods
  getAchievements(): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  unlockAchievement(id: string): Promise<Achievement>;

  // Settings methods
  getUserSettings(): Promise<UserSettings>;
  updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings>;

  // Statistics methods
  getLearningStats(): Promise<LearningStats>;
  updateLearningStats(stats: Partial<LearningStats>): Promise<LearningStats>;
  getDashboardData(): Promise<DashboardData>;
  getLanguageProgress(): Promise<LanguageProgress[]>;
  getWeeklyData(): Promise<WeeklyData>;
}

export class MemStorage implements IStorage {
  private vocabulary: Map<string, Vocabulary> = new Map();
  private userProgress: Map<string, UserProgress> = new Map();
  private pronunciationSessions: Map<string, PronunciationSession> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private userSettings: UserSettings;
  private learningStats: LearningStats;

  constructor() {
    this.initializeSampleData();
    this.userSettings = {
      id: randomUUID(),
      dailyGoal: 20,
      notifications: true,
      autoplay: false,
      theme: "auto",
      appLanguage: "ja",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.learningStats = {
      id: randomUUID(),
      date: new Date(),
      wordsLearned: 12,
      pronunciationMinutes: 15,
      streakDays: 7,
      totalWords: 350,
      masteredWords: 245,
    };
  }

  private initializeSampleData(): void {
    // Sample vocabulary data
    const sampleVocabulary: InsertVocabulary[] = [
      {
        english: "Hello",
        japanese: "こんにちは",
        korean: "안녕하세요",
        french: "Bonjour",
        chinese: "你好",
        pronunciation: "/həˈloʊ/",
        meaning: "挨拶の言葉。相手との関係や時間帯を問わず使える",
        category: "greetings",
        difficulty: 1,
      },
      {
        english: "Beautiful",
        japanese: "美しい",
        korean: "아름다운",
        french: "Belle/Beau",
        chinese: "美丽",
        pronunciation: "/ˈbjuːtɪfəl/",
        meaning: "見た目や心が美しいことを表す形容詞",
        category: "adjectives",
        difficulty: 2,
      },
      {
        english: "Computer",
        japanese: "コンピューター",
        korean: "컴퓨터",
        french: "Ordinateur",
        chinese: "电脑",
        pronunciation: "/kəmˈpjuːtər/",
        meaning: "電子計算機。現代社会に欠かせない機器",
        category: "technology",
        difficulty: 2,
      },
      {
        english: "Freedom",
        japanese: "自由",
        korean: "자유",
        french: "Liberté",
        chinese: "自由",
        pronunciation: "/ˈfriːdəm/",
        meaning: "束縛されることなく、自分の意思で行動できること",
        category: "abstract",
        difficulty: 3,
      },
      {
        english: "Friendship",
        japanese: "友情",
        korean: "우정",
        french: "Amitié",
        chinese: "友谊",
        pronunciation: "/ˈfrɛndʃɪp/",
        meaning: "友達との間に成り立つ信頼関係",
        category: "relationships",
        difficulty: 3,
      }
    ];

    // Create vocabulary entries
    sampleVocabulary.forEach(vocab => {
      const id = randomUUID();
      const vocabulary: Vocabulary = {
        ...vocab,
        id,
        korean: vocab.korean || null,
        french: vocab.french || null,
        chinese: vocab.chinese || null,
        category: vocab.category || null,
        difficulty: vocab.difficulty || null,
        createdAt: new Date(),
      };
      this.vocabulary.set(id, vocabulary);
    });

    // Sample achievements
    const sampleAchievements: { title: string; description: string; icon: string; requirement: string; unlockedAt?: Date }[] = [
      {
        title: "初学習",
        description: "初めての単語を学習しました",
        icon: "fas fa-star",
        requirement: "1単語学習",
        unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        title: "7日連続",
        description: "7日間連続で学習を続けました",
        icon: "fas fa-fire",
        requirement: "7日連続学習",
        unlockedAt: new Date(),
      },
      {
        title: "100単語マスター",
        description: "100個の単語を習得しました",
        icon: "fas fa-trophy",
        requirement: "100単語習得",
      },
    ];

    sampleAchievements.forEach(achievement => {
      const id = randomUUID();
      const newAchievement: Achievement = {
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        requirement: achievement.requirement,
        id,
        createdAt: new Date(),
        unlockedAt: achievement.unlockedAt || null,
      };
      this.achievements.set(id, newAchievement);
    });
  }

  async getVocabulary(): Promise<Vocabulary[]> {
    return Array.from(this.vocabulary.values());
  }

  async getVocabularyById(id: string): Promise<Vocabulary | undefined> {
    return this.vocabulary.get(id);
  }

  async getVocabularyByLanguage(language: string): Promise<Vocabulary[]> {
    // For demo, return all vocabulary regardless of language
    return Array.from(this.vocabulary.values());
  }

  async createVocabulary(vocab: InsertVocabulary): Promise<Vocabulary> {
    const id = randomUUID();
    const vocabulary: Vocabulary = {
      ...vocab,
      id,
      korean: vocab.korean || null,
      french: vocab.french || null,
      chinese: vocab.chinese || null,
      category: vocab.category || null,
      difficulty: vocab.difficulty || null,
      createdAt: new Date(),
    };
    this.vocabulary.set(id, vocabulary);
    return vocabulary;
  }

  async getUserProgress(): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values());
  }

  async getUserProgressByVocabularyId(vocabularyId: string): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values()).find(
      progress => progress.vocabularyId === vocabularyId
    );
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const id = randomUUID();
    const userProgress: UserProgress = {
      ...progress,
      id,
      learned: progress.learned || null,
      difficult: progress.difficult || null,
      correctCount: progress.correctCount || null,
      totalAttempts: progress.totalAttempts || null,
      lastReviewed: progress.lastReviewed || null,
      createdAt: new Date(),
    };
    this.userProgress.set(id, userProgress);
    return userProgress;
  }

  async updateUserProgress(id: string, updates: Partial<UserProgress>): Promise<UserProgress> {
    const existing = this.userProgress.get(id);
    if (!existing) {
      throw new Error(`UserProgress with id ${id} not found`);
    }
    
    const updated = { ...existing, ...updates };
    this.userProgress.set(id, updated);
    return updated;
  }

  async getPronunciationSessions(): Promise<PronunciationSession[]> {
    return Array.from(this.pronunciationSessions.values());
  }

  async createPronunciationSession(session: InsertPronunciationSession): Promise<PronunciationSession> {
    const id = randomUUID();
    const pronunciationSession: PronunciationSession = {
      ...session,
      id,
      language: session.language || null,
      recognizedWord: session.recognizedWord || null,
      accuracy: session.accuracy || null,
      feedback: session.feedback || null,
      sessionDate: new Date(),
    };
    this.pronunciationSessions.set(id, pronunciationSession);
    return pronunciationSession;
  }

  async getTodayPronunciationSessions(): Promise<PronunciationSession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.pronunciationSessions.values()).filter(
      session => session.sessionDate && session.sessionDate >= today
    );
  }

  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = randomUUID();
    const newAchievement: Achievement = {
      ...achievement,
      id,
      createdAt: new Date(),
      unlockedAt: null,
    };
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }

  async unlockAchievement(id: string): Promise<Achievement> {
    const achievement = this.achievements.get(id);
    if (!achievement) {
      throw new Error(`Achievement with id ${id} not found`);
    }
    
    const updated = { ...achievement, unlockedAt: new Date() };
    this.achievements.set(id, updated);
    return updated;
  }

  async getUserSettings(): Promise<UserSettings> {
    return this.userSettings;
  }

  async updateUserSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    this.userSettings = {
      ...this.userSettings,
      ...updates,
      updatedAt: new Date(),
    };
    return this.userSettings;
  }

  async getLearningStats(): Promise<LearningStats> {
    return this.learningStats;
  }

  async updateLearningStats(updates: Partial<LearningStats>): Promise<LearningStats> {
    this.learningStats = {
      ...this.learningStats,
      ...updates,
    };
    return this.learningStats;
  }

  async getDashboardData(): Promise<DashboardData> {
    const unlockedAchievements = Array.from(this.achievements.values())
      .filter(achievement => achievement.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 3);

    return {
      todayStats: {
        wordsLearned: this.learningStats.wordsLearned || 0,
        pronunciationMinutes: this.learningStats.pronunciationMinutes || 0,
        streakDays: this.learningStats.streakDays || 0,
      },
      recentAchievements: unlockedAchievements,
      overallProgress: {
        totalWords: this.learningStats.totalWords || 0,
        masteredWords: this.learningStats.masteredWords || 0,
        percentage: this.learningStats.totalWords && this.learningStats.masteredWords 
          ? Math.round((this.learningStats.masteredWords / this.learningStats.totalWords) * 100)
          : 0,
      },
    };
  }

  async getLanguageProgress(): Promise<LanguageProgress[]> {
    return [
      {
        language: "en",
        flag: "🇺🇸",
        name: "English",
        words: 120,
        progress: 85,
        percentage: 85,
      },
      {
        language: "ko",
        flag: "🇰🇷",
        name: "한국어",
        words: 85,
        progress: 65,
        percentage: 65,
      },
      {
        language: "fr",
        flag: "🇫🇷",
        name: "Français",
        words: 95,
        progress: 72,
        percentage: 72,
      },
      {
        language: "zh",
        flag: "🇨🇳",
        name: "中文",
        words: 50,
        progress: 40,
        percentage: 40,
      },
    ];
  }

  async getWeeklyData(): Promise<WeeklyData> {
    return [
      { label: "月", percentage: 60, minutes: 18 },
      { label: "火", percentage: 80, minutes: 24 },
      { label: "水", percentage: 45, minutes: 13 },
      { label: "木", percentage: 90, minutes: 27 },
      { label: "金", percentage: 70, minutes: 21 },
      { label: "土", percentage: 100, minutes: 30 },
      { label: "日", percentage: 30, minutes: 9 },
    ];
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // Vocabulary methods
  async getVocabulary(): Promise<Vocabulary[]> {
    return await db.select().from(vocabulary).orderBy(vocabulary.difficulty, vocabulary.category);
  }

  async getVocabularyById(id: string): Promise<Vocabulary | undefined> {
    const [result] = await db.select().from(vocabulary).where(eq(vocabulary.id, id));
    return result;
  }

  async getVocabularyByLanguage(language: string): Promise<Vocabulary[]> {
    // For now, return all vocabulary (filtering can be done client-side)
    return await this.getVocabulary();
  }

  async createVocabulary(vocab: InsertVocabulary): Promise<Vocabulary> {
    const [result] = await db.insert(vocabulary).values(vocab).returning();
    return result;
  }

  // User progress methods
  async getUserProgress(): Promise<UserProgress[]> {
    return await db.select().from(userProgress).orderBy(desc(userProgress.lastReviewed));
  }

  async getUserProgressByVocabularyId(vocabularyId: string): Promise<UserProgress | undefined> {
    const [result] = await db.select().from(userProgress).where(eq(userProgress.vocabularyId, vocabularyId));
    return result;
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [result] = await db.insert(userProgress).values(progress).returning();
    return result;
  }

  async updateUserProgress(id: string, updates: Partial<UserProgress>): Promise<UserProgress> {
    const [result] = await db.update(userProgress)
      .set({ ...updates, lastReviewed: new Date() })
      .where(eq(userProgress.id, id))
      .returning();
    return result;
  }

  // Pronunciation session methods
  async getPronunciationSessions(): Promise<PronunciationSession[]> {
    return await db.select().from(pronunciationSessions).orderBy(desc(pronunciationSessions.sessionDate));
  }

  async createPronunciationSession(session: InsertPronunciationSession): Promise<PronunciationSession> {
    const [result] = await db.insert(pronunciationSessions).values(session).returning();
    return result;
  }

  async getTodayPronunciationSessions(): Promise<PronunciationSession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db.select().from(pronunciationSessions)
      .where(gte(pronunciationSessions.sessionDate, today))
      .orderBy(desc(pronunciationSessions.sessionDate));
  }

  // Achievement methods
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).orderBy(achievements.createdAt);
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [result] = await db.insert(achievements).values(achievement).returning();
    return result;
  }

  async unlockAchievement(id: string): Promise<Achievement> {
    const [result] = await db.update(achievements)
      .set({ unlockedAt: new Date() })
      .where(eq(achievements.id, id))
      .returning();
    return result;
  }

  // Settings methods
  async getUserSettings(): Promise<UserSettings> {
    const [result] = await db.select().from(userSettings).limit(1);
    
    if (!result) {
      // Create default settings if none exist
      const defaultSettings = {
        dailyGoal: 20,
        notifications: true,
        autoplay: false,
        theme: "auto" as const,
        appLanguage: "ja" as const,
      };
      const [created] = await db.insert(userSettings).values(defaultSettings).returning();
      return created;
    }
    
    return result;
  }

  async updateUserSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    // Get current settings first
    const current = await this.getUserSettings();
    
    const [result] = await db.update(userSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSettings.id, current.id))
      .returning();
    return result;
  }

  // Statistics methods
  async getLearningStats(): Promise<LearningStats> {
    const [result] = await db.select().from(learningStats).limit(1);
    
    if (!result) {
      // Create default stats if none exist
      const defaultStats = {
        wordsLearned: 0,
        pronunciationMinutes: 0,
        streakDays: 0,
        totalWords: 0,
        masteredWords: 0,
      };
      const [created] = await db.insert(learningStats).values(defaultStats).returning();
      return created;
    }
    
    return result;
  }

  async updateLearningStats(updates: Partial<LearningStats>): Promise<LearningStats> {
    const current = await this.getLearningStats();
    
    const [result] = await db.update(learningStats)
      .set(updates)
      .where(eq(learningStats.id, current.id))
      .returning();
    return result;
  }

  async getDashboardData(): Promise<DashboardData> {
    const stats = await this.getLearningStats();
    const recentAchievements = await db.select().from(achievements)
      .where(sql`${achievements.unlockedAt} IS NOT NULL`)
      .orderBy(desc(achievements.unlockedAt))
      .limit(3);

    return {
      todayStats: {
        wordsLearned: stats.wordsLearned || 0,
        pronunciationMinutes: stats.pronunciationMinutes || 0,
        streakDays: stats.streakDays || 0,
      },
      recentAchievements,
      overallProgress: {
        totalWords: stats.totalWords || 0,
        masteredWords: stats.masteredWords || 0,
        percentage: stats.totalWords && stats.masteredWords
          ? Math.round((stats.masteredWords / stats.totalWords) * 100)
          : 0,
      },
    };
  }

  async getLanguageProgress(): Promise<LanguageProgress[]> {
    // Calculate progress from actual data
    const allVocab = await this.getVocabulary();
    const allProgress = await this.getUserProgress();
    
    const languages = [
      { code: "en", flag: "🇺🇸", name: "English" },
      { code: "ko", flag: "🇰🇷", name: "한국어" },
      { code: "fr", flag: "🇫🇷", name: "Français" },
      { code: "zh", flag: "🇨🇳", name: "中文" },
    ];

    return languages.map(lang => {
      const langVocab = allVocab.filter(v => {
        const langField = lang.code === "en" ? "english" :
                         lang.code === "ko" ? "korean" :
                         lang.code === "fr" ? "french" :
                         lang.code === "zh" ? "chinese" : "english";
        return v[langField as keyof Vocabulary];
      });
      
      const learnedCount = allProgress.filter(p => 
        langVocab.some(v => v.id === p.vocabularyId) && p.learned
      ).length;
      
      const percentage = langVocab.length > 0 ? Math.round((learnedCount / langVocab.length) * 100) : 0;
      
      return {
        language: lang.code,
        flag: lang.flag,
        name: lang.name,
        words: langVocab.length,
        progress: learnedCount,
        percentage,
      };
    });
  }

  async getWeeklyData(): Promise<WeeklyData> {
    // This would calculate from actual pronunciation sessions
    // For now, return sample data - can be enhanced later
    return [
      { label: "月", percentage: 60, minutes: 18 },
      { label: "火", percentage: 80, minutes: 24 },
      { label: "水", percentage: 45, minutes: 13 },
      { label: "木", percentage: 90, minutes: 27 },
      { label: "金", percentage: 70, minutes: 21 },
      { label: "土", percentage: 100, minutes: 30 },
      { label: "日", percentage: 30, minutes: 9 },
    ];
  }

  // Initialize sample data in database
  async initializeSampleData(): Promise<void> {
    // Check if data already exists
    const existingVocab = await db.select().from(vocabulary).limit(1);
    if (existingVocab.length > 0) return;

    // Sample vocabulary data
    const sampleVocabulary: InsertVocabulary[] = [
      {
        english: "Hello",
        japanese: "こんにちは",
        korean: "안녕하세요",
        french: "Bonjour",
        chinese: "你好",
        pronunciation: "/həˈloʊ/",
        meaning: "挨拶の言葉。相手との関係や時間帯を問わず使える",
        category: "greetings",
        difficulty: 1,
      },
      {
        english: "Beautiful",
        japanese: "美しい",
        korean: "아름다운",
        french: "Belle/Beau",
        chinese: "美丽",
        pronunciation: "/ˈbjuːtɪfəl/",
        meaning: "見た目や心が美しいことを表す形容詞",
        category: "adjectives",
        difficulty: 2,
      },
      {
        english: "Computer",
        japanese: "コンピューター",
        korean: "컴퓨터",
        french: "Ordinateur",
        chinese: "电脑",
        pronunciation: "/kəmˈpjuːtər/",
        meaning: "電子計算機。現代社会に欠かせない機器",
        category: "technology",
        difficulty: 2,
      },
      {
        english: "Freedom",
        japanese: "自由",
        korean: "자유",
        french: "Liberté",
        chinese: "自由",
        pronunciation: "/ˈfriːdəm/",
        meaning: "束縛されることなく、自分の意思で行動できること",
        category: "abstract",
        difficulty: 3,
      },
      {
        english: "Friendship",
        japanese: "友情",
        korean: "우정",
        french: "Amitié",
        chinese: "友谊",
        pronunciation: "/ˈfrɛndʃɪp/",
        meaning: "友達との間に成り立つ信頼関係",
        category: "relationships",
        difficulty: 3,
      }
    ];

    // Insert sample vocabulary
    await db.insert(vocabulary).values(sampleVocabulary);

    // Sample achievements
    const sampleAchievements = [
      {
        title: "初学習",
        description: "初めての単語を学習しました",
        icon: "fas fa-star",
        requirement: "1単語学習",
        unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "7日連続",
        description: "7日間連続で学習を続けました",
        icon: "fas fa-fire",
        requirement: "7日連続学習",
        unlockedAt: new Date(),
      },
      {
        title: "100単語マスター",
        description: "100個の単語を習得しました",
        icon: "fas fa-trophy",
        requirement: "100単語習得",
        unlockedAt: null,
      },
    ];

    await db.insert(achievements).values(sampleAchievements);
  }
}

export const storage = new DatabaseStorage();
