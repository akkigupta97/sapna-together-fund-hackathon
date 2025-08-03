// Re-export types from your schema file
export interface User {
    id: string;
    username: string;
    email: string;
    name: string;
    onboardingCompleted: boolean;
    createdAt: Date;
  }
  
  export interface InsertUser {
    username: string;
    email: string;
    name: string;
  }
  
  export interface SleepProfile {
    id: string;
    userId: string;
    bedtime: string;
    wakeTime: string;
    preferredDuration: number;
    soundPreferences: string[];
    sleepEnvironment?: string;
    stressLevel?: number;
    sleepIssues: string[];
    updatedAt: Date;
  }
  
  export interface InsertSleepProfile {
    userId: string;
    bedtime: string;
    wakeTime: string;
    preferredDuration: number;
    soundPreferences?: string[];
    sleepEnvironment?: string;
    stressLevel?: number;
    sleepIssues?: string[];
  }
  
  export interface SleepSession {
    id: string;
    userId: string;
    startTime: Date;
    endTime: Date | null;
    duration?: number;
    quality?: number;
    deepSleep?: number;
    lightSleep?: number;
    remSleep?: number;
    audioUsed?: string;
    notes?: string;
    createdAt: Date;
  }
  
  export interface InsertSleepSession {
    userId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    quality?: number;
    deepSleep?: number;
    lightSleep?: number;
    remSleep?: number;
    audioUsed?: string;
    notes?: string;
  }
  
  export interface GeneratedAudio {
    id: string;
    userId: string;
    title: string;
    description?: string;
    category: string;
    prompt: string;
    elevenLabsVoiceId?: string;
    audioUrl?: string;
    duration?: number;
    isFavorite: boolean;
    playCount: number;
    createdAt: Date;
  }
  
  export interface InsertGeneratedAudio {
    userId: string;
    title: string;
    description?: string;
    category: string;
    prompt: string;
    elevenLabsVoiceId?: string;
    audioUrl?: string;
    duration?: number;
  }
  
  export interface ChatMessage {
    id: string;
    userId: string;
    role: string;
    content: string;
    timestamp: Date;
  }
  
  export interface InsertChatMessage {
    userId: string;
    role: string;
    content: string;
  }
  
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
  
  // Lambda-specific types
  export interface LambdaResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  }
  
  export interface AudioGenerationRequest {
    userId: string;
    category: string;
    preferences: string[];
    duration: number;
    environment: string;
  }
  
  export interface ChatRequest {
    userId: string;
    content: string;
  }
  
  export interface ChatResponse {
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  }