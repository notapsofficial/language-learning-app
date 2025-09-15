import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createRepository, uploadFiles } from "./github";
import fs from "fs";
import path from "path";

// Initialize sample data on server start
storage.initializeSampleData().catch(console.error);
import { insertUserProgressSchema, insertPronunciationSessionSchema, insertUserSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Vocabulary routes
  app.get("/api/vocabulary", async (req, res) => {
    try {
      const vocabulary = await storage.getVocabulary();
      res.json(vocabulary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary" });
    }
  });

  app.get("/api/vocabulary/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const vocabulary = await storage.getVocabularyById(id);
      if (!vocabulary) {
        return res.status(404).json({ message: "Vocabulary not found" });
      }
      res.json(vocabulary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary" });
    }
  });

  app.get("/api/vocabulary/language/:language", async (req, res) => {
    try {
      const { language } = req.params;
      const vocabulary = await storage.getVocabularyByLanguage(language);
      res.json(vocabulary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary for language" });
    }
  });

  // User progress routes
  app.get("/api/progress", async (req, res) => {
    try {
      const progress = await storage.getUserProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    try {
      const validatedData = insertUserProgressSchema.parse(req.body);
      const progress = await storage.createUserProgress(validatedData);
      res.status(201).json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user progress" });
    }
  });

  app.put("/api/progress/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const progress = await storage.updateUserProgress(id, updates);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user progress" });
    }
  });

  // Pronunciation session routes
  app.get("/api/pronunciation-sessions", async (req, res) => {
    try {
      const sessions = await storage.getPronunciationSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pronunciation sessions" });
    }
  });

  app.get("/api/pronunciation-sessions/today", async (req, res) => {
    try {
      const sessions = await storage.getTodayPronunciationSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's pronunciation sessions" });
    }
  });

  app.post("/api/pronunciation-sessions", async (req, res) => {
    try {
      const validatedData = insertPronunciationSessionSchema.parse(req.body);
      const session = await storage.createPronunciationSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create pronunciation session" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.put("/api/achievements/:id/unlock", async (req, res) => {
    try {
      const { id } = req.params;
      const achievement = await storage.unlockAchievement(id);
      res.json(achievement);
    } catch (error) {
      res.status(500).json({ message: "Failed to unlock achievement" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getUserSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateUserSettings(updates);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Dashboard data routes
  app.get("/api/dashboard", async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData();
      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/language-progress", async (req, res) => {
    try {
      const languageProgress = await storage.getLanguageProgress();
      res.json(languageProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch language progress" });
    }
  });

  app.get("/api/weekly-data", async (req, res) => {
    try {
      const weeklyData = await storage.getWeeklyData();
      res.json(weeklyData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly data" });
    }
  });

  // Learning stats routes
  app.get("/api/learning-stats", async (req, res) => {
    try {
      const stats = await storage.getLearningStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning statistics" });
    }
  });

  app.put("/api/learning-stats", async (req, res) => {
    try {
      const updates = req.body;
      const stats = await storage.updateLearningStats(updates);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to update learning statistics" });
    }
  });

  // GitHub repository routes
  app.post("/api/github/create-repo", async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Repository name is required" });
      }
      
      const repo = await createRepository(name, description);
      res.json({ 
        success: true, 
        repo: {
          name: repo.name,
          full_name: repo.full_name,
          html_url: repo.html_url,
          clone_url: repo.clone_url
        }
      });
    } catch (error) {
      console.error("Failed to create repository:", error);
      res.status(500).json({ 
        message: "Failed to create repository", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/github/upload", async (req, res) => {
    try {
      const { repoOwner, repoName } = req.body;
      if (!repoOwner || !repoName) {
        return res.status(400).json({ message: "Repository owner and name are required" });
      }

      // Get all project files
      const files: { path: string; content: string }[] = [];
      
      // Helper function to read files recursively
      const readDirectory = (dirPath: string, relativePath: string = ''): void => {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const relPath = relativePath ? path.join(relativePath, item) : item;
          
          // Skip node_modules, .git, dist, and other build directories
          if (item === 'node_modules' || item === '.git' || item === 'dist' || 
              item === '.next' || item === 'build' || item.startsWith('.') ||
              item === 'tmp') {
            continue;
          }
          
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            readDirectory(fullPath, relPath);
          } else if (stat.isFile()) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              files.push({ path: relPath, content });
            } catch (err) {
              console.warn(`Skipping binary file: ${relPath}`);
            }
          }
        }
      }
      
      // Read all files from the project root
      readDirectory(process.cwd());
      
      const results = await uploadFiles(repoOwner, repoName, files);
      
      res.json({
        success: true,
        uploaded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results
      });
    } catch (error) {
      console.error("Failed to upload files:", error);
      res.status(500).json({ 
        message: "Failed to upload files", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
