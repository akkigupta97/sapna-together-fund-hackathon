import { 
  type User, 
  type InsertUser,
  type SleepProfile,
  type InsertSleepProfile,
  type SleepSession,
  type InsertSleepSession,
  type GeneratedAudio,
  type InsertGeneratedAudio,
  type ChatMessage,
  type InsertChatMessage
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Sleep Profiles
  getSleepProfile(userId: string): Promise<SleepProfile | undefined>;
  createSleepProfile(profile: InsertSleepProfile): Promise<SleepProfile>;
  updateSleepProfile(userId: string, updates: Partial<SleepProfile>): Promise<SleepProfile>;

  // Sleep Sessions
  getSleepSessions(userId: string): Promise<SleepSession[]>;
  createSleepSession(session: InsertSleepSession): Promise<SleepSession>;
  updateSleepSession(id: string, updates: Partial<SleepSession>): Promise<SleepSession>;
  getLatestSleepSession(userId: string): Promise<SleepSession | undefined>;

  // Generated Audios
  getGeneratedAudios(userId: string): Promise<GeneratedAudio[]>;
  createGeneratedAudio(audio: InsertGeneratedAudio): Promise<GeneratedAudio>;
  updateGeneratedAudio(id: string, updates: Partial<GeneratedAudio>): Promise<GeneratedAudio>;
  getFavoriteAudios(userId: string): Promise<GeneratedAudio[]>;

  // Chat Messages
  getChatMessages(userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sleepProfiles: Map<string, SleepProfile>;
  private sleepSessions: Map<string, SleepSession>;
  private generatedAudios: Map<string, GeneratedAudio>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.sleepProfiles = new Map();
    this.sleepSessions = new Map();
    this.generatedAudios = new Map();
    this.chatMessages = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      onboardingCompleted: false
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Sleep Profiles
  async getSleepProfile(userId: string): Promise<SleepProfile | undefined> {
    return Array.from(this.sleepProfiles.values()).find(profile => profile.userId === userId);
  }

  async createSleepProfile(insertProfile: InsertSleepProfile): Promise<SleepProfile> {
    const id = randomUUID();
    const profile: SleepProfile = { 
      ...insertProfile, 
      id, 
      updatedAt: new Date()
    };
    this.sleepProfiles.set(id, profile);
    return profile;
  }

  async updateSleepProfile(userId: string, updates: Partial<SleepProfile>): Promise<SleepProfile> {
    const profile = Array.from(this.sleepProfiles.values()).find(p => p.userId === userId);
    if (!profile) throw new Error("Sleep profile not found");
    const updatedProfile = { ...profile, ...updates, updatedAt: new Date() };
    this.sleepProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  // Sleep Sessions
  async getSleepSessions(userId: string): Promise<SleepSession[]> {
    return Array.from(this.sleepSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async createSleepSession(insertSession: InsertSleepSession): Promise<SleepSession> {
    const id = randomUUID();
    const session: SleepSession = { 
      ...insertSession, 
      id, 
      createdAt: new Date()
    };
    this.sleepSessions.set(id, session);
    return session;
  }

  async updateSleepSession(id: string, updates: Partial<SleepSession>): Promise<SleepSession> {
    const session = this.sleepSessions.get(id);
    if (!session) throw new Error("Sleep session not found");
    const updatedSession = { ...session, ...updates };
    this.sleepSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getLatestSleepSession(userId: string): Promise<SleepSession | undefined> {
    const sessions = await this.getSleepSessions(userId);
    return sessions[0];
  }

  // Generated Audios
  async getGeneratedAudios(userId: string): Promise<GeneratedAudio[]> {
    return Array.from(this.generatedAudios.values())
      .filter(audio => audio.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createGeneratedAudio(insertAudio: InsertGeneratedAudio): Promise<GeneratedAudio> {
    const id = randomUUID();
    const audio: GeneratedAudio = { 
      ...insertAudio, 
      id, 
      createdAt: new Date(),
      playCount: 0,
      isFavorite: false
    };
    this.generatedAudios.set(id, audio);
    return audio;
  }

  async updateGeneratedAudio(id: string, updates: Partial<GeneratedAudio>): Promise<GeneratedAudio> {
    const audio = this.generatedAudios.get(id);
    if (!audio) throw new Error("Generated audio not found");
    const updatedAudio = { ...audio, ...updates };
    this.generatedAudios.set(id, updatedAudio);
    return updatedAudio;
  }

  async getFavoriteAudios(userId: string): Promise<GeneratedAudio[]> {
    return Array.from(this.generatedAudios.values())
      .filter(audio => audio.userId === userId && audio.isFavorite)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  // Chat Messages
  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      timestamp: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
