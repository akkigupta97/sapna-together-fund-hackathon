import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  QueryCommand,
  ScanCommand 
} from '@aws-sdk/lib-dynamodb';
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
  type InsertChatMessage,
  type SelectGeneratedAudio
} from '../schema';
import { randomUUID } from 'crypto';

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
  getGeneratedAudios(userId: string): Promise<SelectGeneratedAudio[]>;
  createGeneratedAudio(data: InsertGeneratedAudio): Promise<SelectGeneratedAudio>;
  updateGeneratedAudio(audioId: string, updates: Partial<SelectGeneratedAudio>): Promise<SelectGeneratedAudio>;
  getFavoriteAudios(userId: string): Promise<GeneratedAudio[]>;

  // Chat Messages
  getChatMessages(userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DynamoDBStorage implements IStorage {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'sleep-tracker';
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    try {
      const response = await this.client.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${id}`,
          SK: 'PROFILE'
        }
      }));
      
      return response.Item ? this.deserializeUser(response.Item) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const response = await this.client.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'email = :email AND SK = :sk',
        ExpressionAttributeValues: {
          ':email': email,
          ':sk': 'PROFILE'
        }
      }));

      return response.Items?.[0] ? this.deserializeUser(response.Items[0]) : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date().toISOString(),
      onboardingCompleted: false
    };

    try {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `USER#${id}`,
          SK: 'PROFILE',
          ...user,
          EntityType: 'User'
        }
      }));

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const updateExpression = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      for (const [key, value] of Object.entries(updates)) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }

      const response = await this.client.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${id}`,
          SK: 'PROFILE'
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }));

      return this.deserializeUser(response.Attributes!);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Sleep Profiles
  async getSleepProfile(userId: string): Promise<SleepProfile | undefined> {
    try {
      const response = await this.client.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: 'SLEEP_PROFILE'
        }
      }));
      
      return response.Item ? this.deserializeSleepProfile(response.Item) : undefined;
    } catch (error) {
      console.error('Error getting sleep profile:', error);
      throw error;
    }
  }

  async createSleepProfile(insertProfile: InsertSleepProfile): Promise<SleepProfile> {
    const id = randomUUID();
    const profile: SleepProfile = { 
      ...insertProfile, 
      id, 
      soundPreferences: insertProfile.soundPreferences || [],
      sleepIssues: insertProfile.sleepIssues || [],
      updatedAt: new Date().toISOString()
    };

    try {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `USER#${insertProfile.userId}`,
          SK: 'SLEEP_PROFILE',
          ...profile,
          EntityType: 'SleepProfile'
        }
      }));

      return profile;
    } catch (error) {
      console.error('Error creating sleep profile:', error);
      throw error;
    }
  }

  async updateSleepProfile(userId: string, updates: Partial<SleepProfile>): Promise<SleepProfile> {
    try {
      const updateExpression = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      for (const [key, value] of Object.entries(updates)) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }

      // Always update the updatedAt timestamp
      updateExpression.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date();

      const response = await this.client.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: 'SLEEP_PROFILE'
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }));

      return this.deserializeSleepProfile(response.Attributes!);
    } catch (error) {
      console.error('Error updating sleep profile:', error);
      throw error;
    }
  }

  // Sleep Sessions
  async getSleepSessions(userId: string): Promise<SleepSession[]> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'SESSION#'
        },
        ScanIndexForward: false // Sort in descending order
      }));

      return response.Items?.map(item => this.deserializeSleepSession(item)) || [];
    } catch (error) {
      console.error('Error getting sleep sessions:', error);
      throw error;
    }
  }

  async createSleepSession(insertSession: InsertSleepSession): Promise<SleepSession> {
    const id = randomUUID();
    const session: SleepSession = { 
      ...insertSession, 
      id, 
      endTime: insertSession.endTime || null,
      createdAt: new Date().toISOString()
    };

    try {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `USER#${insertSession.userId}`,
          SK: `SESSION#${session.startTime.toISOString()}#${id}`,
          ...session,
          EntityType: 'SleepSession'
        }
      }));

      return session;
    } catch (error) {
      console.error('Error creating sleep session:', error);
      throw error;
    }
  }

  async updateSleepSession(id: string, updates: Partial<SleepSession>): Promise<SleepSession> {
    try {
      // First, find the session to get the PK and SK
      const response = await this.client.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'id = :id AND EntityType = :entityType',
        ExpressionAttributeValues: {
          ':id': id,
          ':entityType': 'SleepSession'
        }
      }));

      if (!response.Items?.[0]) {
        throw new Error('Sleep session not found');
      }

      const item = response.Items[0];
      const updateExpression = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      for (const [key, value] of Object.entries(updates)) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }

      const updateResponse = await this.client.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: item.PK,
          SK: item.SK
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }));

      return this.deserializeSleepSession(updateResponse.Attributes!);
    } catch (error) {
      console.error('Error updating sleep session:', error);
      throw error;
    }
  }

  async getLatestSleepSession(userId: string): Promise<SleepSession | undefined> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'SESSION#'
        },
        ScanIndexForward: false,
        Limit: 1
      }));

      return response.Items?.[0] ? this.deserializeSleepSession(response.Items[0]) : undefined;
    } catch (error) {
      console.error('Error getting latest sleep session:', error);
      throw error;
    }
  }

  async createGeneratedAudio(data: InsertGeneratedAudio): Promise<SelectGeneratedAudio> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const item = {
      PK: `USER#${data.userId}`,
      SK: `AUDIO#${id}`,
      type: 'GeneratedAudio',
      id,
      userId: data.userId,
      title: data.title,
      description: data.description || null,
      category: data.category,
      prompt: data.prompt || null,
      audioUrl: data.audioUrl || null,
      duration: data.duration || null,
      // New fields for personalized mixes
      tracks: data.tracks ? JSON.stringify(data.tracks) : null,
      chronotype: data.chronotype || null,
      persona: data.persona || null,
      soundPreferences: data.soundPreferences ? JSON.stringify(data.soundPreferences) : null,
      playCount: 0,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      })
    );

    return this.mapToGeneratedAudio(item);
  }

  // Updated getGeneratedAudios method
  async getGeneratedAudios(userId: string): Promise<SelectGeneratedAudio[]> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'AUDIO#',
        },
        ScanIndexForward: false, // Most recent first
      })
    );

    return (response.Items || []).map(this.mapToGeneratedAudio);
  }

  // Updated updateGeneratedAudio method
  async updateGeneratedAudio(audioId: string, updates: Partial<SelectGeneratedAudio>): Promise<SelectGeneratedAudio> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Handle all possible update fields
    const updateableFields = [
      'title', 'description', 'playCount', 'isFavorite', 
      'tracks', 'soundPreferences'
    ];

    updateableFields.forEach(field => {
      if (updates[field as keyof SelectGeneratedAudio] !== undefined) {
        const attrName = `#${field}`;
        const attrValue = `:${field}`;
        
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = field;
        
        // Handle JSON fields
        if (field === 'tracks' || field === 'soundPreferences') {
          expressionAttributeValues[attrValue] = updates[field as keyof SelectGeneratedAudio] 
            ? JSON.stringify(updates[field as keyof SelectGeneratedAudio]) 
            : null;
        } else {
          expressionAttributeValues[attrValue] = updates[field as keyof SelectGeneratedAudio];
        }
      }
    });

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    // First, get the current item to find the correct pk
    const currentItem = await this.getGeneratedAudioById(audioId);
    if (!currentItem) {
      throw new Error('Generated audio not found');
    }

    const response = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${currentItem.userId}`,
          SK: `AUDIO#${audioId}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return this.mapToGeneratedAudio(response.Attributes!);
  }

  // Helper method to get a single generated audio by ID
  async getGeneratedAudioById(audioId: string): Promise<SelectGeneratedAudio | null> {
    // Since we need to find the audio across all users, we'll need to scan
    // In a production system, you might want to add a GSI for this
    const response = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: '#type = :type AND id = :id',
        ExpressionAttributeNames: {
          '#type': 'type',
        },
        ExpressionAttributeValues: {
          ':type': 'GeneratedAudio',
          ':id': audioId,
        },
      })
    );

    const item = response.Items?.[0];
    return item ? this.mapToGeneratedAudio(item) : null;
  }

  // Get personalized audio mixes for a user
  async getPersonalizedAudioMixes(userId: string): Promise<SelectGeneratedAudio[]> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'AUDIO#',
          ':category': 'personalized_mix',
        },
        ScanIndexForward: false,
      })
    );

    return (response.Items || []).map(this.mapToGeneratedAudio);
  }

  // Updated mapping function to handle new fields
  private mapToGeneratedAudio(item: any): SelectGeneratedAudio {
    return {
      id: item.id,
      userId: item.userId,
      title: item.title,
      description: item.description,
      category: item.category,
      prompt: item.prompt,
      audioUrl: item.audioUrl,
      duration: item.duration,
      // Parse JSON fields
      tracks: item.tracks ? JSON.parse(item.tracks) : null,
      chronotype: item.chronotype,
      persona: item.persona,
      soundPreferences: item.soundPreferences ? JSON.parse(item.soundPreferences) : null,
      playCount: item.playCount || 0,
      isFavorite: item.isFavorite || false,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async getFavoriteAudios(userId: string): Promise<GeneratedAudio[]> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'isFavorite = :isFavorite',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'AUDIO#',
          ':isFavorite': true
        },
        ScanIndexForward: false
      }));

      return response.Items?.map(item => this.deserializeGeneratedAudio(item)) || [];
    } catch (error) {
      console.error('Error getting favorite audios:', error);
      throw error;
    }
  }

  // Chat Messages
  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'MESSAGE#'
        },
        ScanIndexForward: true // Sort in ascending order for chat messages
      }));

      return response.Items?.map(item => this.deserializeChatMessage(item)) || [];
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      timestamp: new Date().toISOString()
    };

    try {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `USER#${insertMessage.userId}`,
          SK: `MESSAGE#${message.timestamp!}#${id}`,
          ...message,
          EntityType: 'ChatMessage'
        }
      }));

      return message;
    } catch (error) {
      console.error('Error creating chat message:', error);
      throw error;
    }
  }

  // Deserialization methods
  private deserializeUser(item: any): User {
    return {
      id: item.id,
      username: item.username,
      email: item.email,
      name: item.name,
      onboardingCompleted: item.onboardingCompleted || false,
      createdAt: new Date(item.createdAt).toISOString()
    };
  }

  private deserializeSleepProfile(item: any): SleepProfile {
    return {
      id: item.id,
      userId: item.userId,
      bedtime: item.bedtime,
      wakeTime: item.wakeTime,
      preferredDuration: item.preferredDuration,
      soundPreferences: item.soundPreferences || [],
      sleepEnvironment: item.sleepEnvironment,
      stressLevel: item.stressLevel,
      sleepIssues: item.sleepIssues || [],
      updatedAt: new Date(item.updatedAt).toISOString()
    };
  }

  private deserializeSleepSession(item: any): SleepSession {
    return {
      id: item.id,
      userId: item.userId,
      startTime: new Date(item.startTime),
      endTime: item.endTime ? new Date(item.endTime) : null,
      duration: item.duration,
      quality: item.quality,
      deepSleep: item.deepSleep,
      lightSleep: item.lightSleep,
      remSleep: item.remSleep,
      audioUsed: item.audioUsed,
      notes: item.notes,
      createdAt: new Date(item.createdAt).toISOString()
    };
  }

  private deserializeGeneratedAudio(item: any): GeneratedAudio {
    return {
      id: item.id,
      userId: item.userId,
      title: item.title,
      description: item.description,
      category: item.category,
      prompt: item.prompt,
      elevenLabsVoiceId: item.elevenLabsVoiceId,
      audioUrl: item.audioUrl,
      duration: item.duration,
      isFavorite: item.isFavorite || false,
      playCount: item.playCount || 0,
      createdAt: new Date(item.createdAt).toISOString()
    };
  }

  private deserializeChatMessage(item: any): ChatMessage {
    return {
      id: item.id,
      userId: item.userId,
      role: item.role,
      content: item.content,
      timestamp: new Date(item.timestamp).toISOString()
    };
  }
}
