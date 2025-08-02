import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertSleepProfileSchema, 
  insertSleepSessionSchema,
  insertGeneratedAudioSchema,
  insertChatMessageSchema
} from "@shared/schema";
import { elevenLabsService } from "./services/elevenlabs";
import { sleepChatService } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Users
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Sleep Profiles
  app.get("/api/sleep-profile/:userId", async (req, res) => {
    try {
      const profile = await storage.getSleepProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ message: "Sleep profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sleep-profile", async (req, res) => {
    try {
      const profileData = insertSleepProfileSchema.parse(req.body);
      const profile = await storage.createSleepProfile(profileData);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/sleep-profile/:userId", async (req, res) => {
    try {
      const profile = await storage.updateSleepProfile(req.params.userId, req.body);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Sleep Sessions
  app.get("/api/sleep-sessions/:userId", async (req, res) => {
    try {
      const sessions = await storage.getSleepSessions(req.params.userId);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sleep-sessions", async (req, res) => {
    try {
      const sessionData = insertSleepSessionSchema.parse(req.body);
      const session = await storage.createSleepSession(sessionData);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/sleep-sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateSleepSession(req.params.id, req.body);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/sleep-sessions/:userId/latest", async (req, res) => {
    try {
      const session = await storage.getLatestSleepSession(req.params.userId);
      if (!session) {
        return res.status(404).json({ message: "No sleep sessions found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generated Audios
  app.get("/api/audios/:userId", async (req, res) => {
    try {
      const audios = await storage.getGeneratedAudios(req.params.userId);
      res.json(audios);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/audios/generate", async (req, res) => {
    try {
      const { userId, category, preferences, duration, environment } = req.body;
      
      // Generate prompt based on sleep profile
      const prompt = elevenLabsService.generateSleepPrompt(category, preferences, duration, environment);
      
      try {
        // Generate audio with ElevenLabs
        const audioBuffer = await elevenLabsService.generateAudio(prompt);
        
        if (!audioBuffer) {
          throw new Error("Failed to generate audio");
        }

        // In a real app, you'd save this to cloud storage and return the URL
        // For now, we'll create a mock URL
        const audioUrl = `${req.protocol}://${req.get('host')}/api/audios/stream/${Date.now()}`;
        
        const audioData = {
          userId,
          title: `Generated ${category} audio`,
          description: `AI-generated ${category} sounds based on your sleep profile`,
          category,
          prompt,
          audioUrl,
          duration: duration * 60, // convert minutes to seconds
        };

        const audio = await storage.createGeneratedAudio(audioData);
        res.json(audio);
      } catch (audioError) {
        console.error("Audio generation failed:", audioError);
        res.status(500).json({ message: "Failed to generate audio. Please try again." });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/audios/:id", async (req, res) => {
    try {
      const audio = await storage.updateGeneratedAudio(req.params.id, req.body);
      res.json(audio);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/audios/:userId/favorites", async (req, res) => {
    try {
      const favorites = await storage.getFavoriteAudios(req.params.userId);
      res.json(favorites);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Chat
  app.get("/api/chat/:userId", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.userId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { userId, content } = req.body;
      
      // Save user message
      const userMessage = await storage.createChatMessage({
        userId,
        role: "user",
        content
      });

      // Get chat history for context
      const chatHistory = await storage.getChatMessages(userId);
      
      try {
        // Generate AI response
        const aiResponse = await sleepChatService.generateResponse(
          content, 
          chatHistory.map(msg => ({ role: msg.role, content: msg.content }))
        );

        // Save AI response
        const assistantMessage = await storage.createChatMessage({
          userId,
          role: "assistant", 
          content: aiResponse
        });

        res.json({ userMessage, assistantMessage });
      } catch (chatError) {
        console.error("Chat response failed:", chatError);
        // Save fallback response
        const fallbackMessage = await storage.createChatMessage({
          userId,
          role: "assistant",
          content: "I'm having trouble connecting right now, but I'm here to help with your sleep wellness. Try asking me again in a moment!"
        });
        
        res.json({ userMessage, assistantMessage: fallbackMessage });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Sleep insights
  app.get("/api/sleep-insights/:userId", async (req, res) => {
    try {
      const sessions = await storage.getSleepSessions(req.params.userId);
      const insights = await sleepChatService.analyzeSleepData(sessions);
      res.json({ insights });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
