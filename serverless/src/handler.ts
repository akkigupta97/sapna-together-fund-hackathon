import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBStorage } from './storage/dynamodb';
import { 
  insertUserSchema, 
  insertSleepProfileSchema, 
  insertSleepSessionSchema,
  insertGeneratedAudioSchema,
  insertChatMessageSchema
} from './schema';
import { elevenLabsService } from './services/elevenlabs';
import { sleepChatService } from './services/openai';
import { s3Service } from './services/s3';

const storage = new DynamoDBStorage();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Enable CORS
  const headers = {
    'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers':
              'Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Auth-Token, X-Amzn-Trace-Id, x-amzn-RequestId, x-amz-apigw-id, x-amzn-ErrorType, x-amzn-ErrorMessage, Date',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Max-Age': 86400,
            'Access-Control-Expose-Headers':
              'Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Auth-Token, X-Amzn-Trace-Id, x-amzn-RequestId, x-amz-apigw-id, x-amzn-ErrorType, x-amzn-ErrorMessage, Date',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { httpMethod, path, pathParameters, body } = event;
    const parsedBody = body ? JSON.parse(body) : {};

    // Route handling with improved pattern matching
    const routeHandler = getRouteHandler(httpMethod, path);
    
    if (!routeHandler) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Route not found' })
      };
    }

    console.log(`Processing ${httpMethod} ${path}`);
    
    return await routeHandler(pathParameters, parsedBody, headers);
    
  } catch (error: any) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: error.message || 'Internal server error',
        ...(process.env.STAGE === 'dev' && { stack: error.stack })
      })
    };
  }
};

interface PersonaQuestions {
  biggestChallenge: 'falling_asleep' | 'waking_frequently' | 'waking_early' | 'feeling_tired';
  stressLevel: 'low' | 'medium' | 'high';
  thoughtsState: 'calm' | 'busy' | 'racing';
}

interface SoundPreferences {
  gentleMusic: 'like' | 'neutral' | 'dislike';
  natureSounds: 'like' | 'neutral' | 'dislike';
  whisperingVoice: 'like' | 'neutral' | 'dislike';
  whiteNoise: 'like' | 'neutral' | 'dislike';
}

interface AudioTrack {
  type: string;
  weight: number;
  duration?: number;
  audioUrl?: string;
}

// Route mapping function
function getRouteHandler(method: string, path: string) {
  const routes: Record<string, Function> = {
    // Users
    'POST /api/users': handleCreateUser,
    'GET /api/users/{id}': handleGetUser,
    'PATCH /api/users/{id}': handleUpdateUser,

    // Sleep Profiles
    'GET /api/sleep-profile/{userId}': handleGetSleepProfile,
    'POST /api/sleep-profile': handleCreateSleepProfile,
    'PATCH /api/sleep-profile/{userId}': handleUpdateSleepProfile,

    // Sleep Sessions
    'GET /api/sleep-sessions/users/{userId}': handleGetSleepSessions,
    'POST /api/sleep-sessions': handleCreateSleepSession,
    'PATCH /api/sleep-sessions/{id}': handleUpdateSleepSession,
    'GET /api/sleep-sessions/users/{userId}/latest': handleGetLatestSleepSession,

    // Generated Audios
    'GET /api/audios/users/{userId}': handleGetGeneratedAudios,
    'POST /api/audios/generate': handleGenerateAudio,
    'PATCH /api/audios/{id}': handleUpdateGeneratedAudio,
    'GET /api/audios/users/{userId}/favorites': handleGetFavoriteAudios,
    'POST /api/audios/personalized': handleGeneratePersonalizedAudio,
    'GET /api/audios/config': handleGetAudioConfig,

    // Chat
    'GET /api/chat/{userId}': handleGetChatMessages,
    'POST /api/chat': handleCreateChat,

    // Sleep Insights
    'GET /api/sleep-insights/{userId}': handleGetSleepInsights,
  };

  const routeKey = `${method} ${path}`;
  return routes[routeKey];
}

// User handlers
async function handleCreateUser(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const userData = insertUserSchema.parse(body);
    const user = await storage.createUser(userData);
    return { statusCode: 201, headers, body: JSON.stringify(user) };
  } catch (error: any) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleGetUser(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const user = await storage.getUser(params?.id);
    if (!user) {
      return { statusCode: 404, headers, body: JSON.stringify({ message: "User not found" }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify(user) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleUpdateUser(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const user = await storage.updateUser(params?.id, body);
    return { statusCode: 200, headers, body: JSON.stringify(user) };
  } catch (error: any) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: error.message }) };
  }
}

// Sleep Profile handlers
async function handleGetSleepProfile(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const profile = await storage.getSleepProfile(params?.userId);
    if (!profile) {
      return { statusCode: 404, headers, body: JSON.stringify({ message: "Sleep profile not found" }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify(profile) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleCreateSleepProfile(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const profileData = insertSleepProfileSchema.parse(body);
    const profile = await storage.createSleepProfile(profileData);
    return { statusCode: 201, headers, body: JSON.stringify(profile) };
  } catch (error: any) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleUpdateSleepProfile(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const profile = await storage.updateSleepProfile(params?.userId, body);
    return { statusCode: 200, headers, body: JSON.stringify(profile) };
  } catch (error: any) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: error.message }) };
  }
}

// Sleep Session handlers
async function handleGetSleepSessions(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const sessions = await storage.getSleepSessions(params?.userId);
    return { statusCode: 200, headers, body: JSON.stringify(sessions) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleCreateSleepSession(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const sessionData = insertSleepSessionSchema.parse(body);
    const session = await storage.createSleepSession(sessionData);
    return { statusCode: 201, headers, body: JSON.stringify(session) };
  } catch (error: any) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleUpdateSleepSession(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const session = await storage.updateSleepSession(params?.id, body);
    return { statusCode: 200, headers, body: JSON.stringify(session) };
  } catch (error: any) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleGetLatestSleepSession(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const session = await storage.getLatestSleepSession(params?.userId);
    if (!session) {
      return { statusCode: 404, headers, body: JSON.stringify({ message: "No sleep sessions found" }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify(session) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ message: error.message }) };
  }
}

// Generated Audio handlers with S3 integration
async function handleGetGeneratedAudios(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const audios = await storage.getGeneratedAudios(params?.userId);
    return { statusCode: 200, headers, body: JSON.stringify(audios) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleGenerateAudio(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const { userId, category, preferences, duration, environment } = body;
    
    if (!userId || !category || !duration) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: "Missing required fields: userId, category, duration" }) 
      };
    }

    // Generate prompt based on sleep profile
    const prompt = elevenLabsService.generateSleepPrompt(category, preferences, duration, environment);
    
    try {
      // Generate audio with ElevenLabs and upload to S3
      const fileName = `${category}-${Date.now()}`;
      const audioUrl = await elevenLabsService.generateAndUploadAudio(prompt, fileName);
      
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
      return { statusCode: 201, headers, body: JSON.stringify(audio) };
      
    } catch (audioError: any) {
      console.error("Audio generation failed:", audioError);
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ 
          message: "Failed to generate audio. Please try again.",
          error: process.env.STAGE === 'dev' ? audioError.message : undefined
        }) 
      };
    }
  } catch (error: any) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleUpdateGeneratedAudio(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const audio = await storage.updateGeneratedAudio(params?.id, body);
    return { statusCode: 200, headers, body: JSON.stringify(audio) };
  } catch (error: any) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleGetFavoriteAudios(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const favorites = await storage.getFavoriteAudios(params?.userId);
    return { statusCode: 200, headers, body: JSON.stringify(favorites) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ message: error.message }) };
  }
}

// Chat handlers
async function handleGetChatMessages(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const messages = await storage.getChatMessages(params?.userId);
    return { statusCode: 200, headers, body: JSON.stringify(messages) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleCreateChat(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const { userId, content } = body;
    
    if (!userId || !content) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: "Missing required fields: userId, content" }) 
      };
    }
    
    // Save user message
    const userMessage = await storage.createChatMessage({
      userId,
      role: "user",
      content
    });

    // Get chat history for context (limit to last 20 messages for performance)
    const chatHistory = await storage.getChatMessages(userId);
    const recentHistory = chatHistory.slice(-20);
    
    try {
      // Generate AI response
      const aiResponse = await sleepChatService.generateResponse(
        content, 
        recentHistory.map(msg => ({ role: msg.role, content: msg.content }))
      );

      // Save AI response
      const assistantMessage = await storage.createChatMessage({
        userId,
        role: "assistant", 
        content: aiResponse
      });

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ userMessage, assistantMessage }) 
      };
      
    } catch (chatError: any) {
      console.error("Chat response failed:", chatError);
      
      // Save fallback response
      const fallbackMessage = await storage.createChatMessage({
        userId,
        role: "assistant",
        content: "I'm having trouble connecting right now, but I'm here to help with your sleep wellness. Try asking me again in a moment!"
      });
      
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ userMessage, assistantMessage: fallbackMessage }) 
      };
    }
  } catch (error: any) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleGetSleepInsights(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const sessions = await storage.getSleepSessions(params?.userId);
    const insights = await sleepChatService.analyzeSleepData(sessions);
    return { statusCode: 200, headers, body: JSON.stringify({ insights }) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ message: error.message }) };
  }
}

async function handleGeneratePersonalizedAudio(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const { 
      userId, 
      chronotype, 
      persona,
      soundPreferences,
      tracks,
      generatedAudios
    } = body;
    
    if (!userId || !chronotype || !persona || !tracks) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: "Missing required fields: userId, chronotype, persona, tracks" }) 
      };
    }

    const processedTracks: AudioTrack[] = [];
    
    // Process generated audio files if any
    if (generatedAudios && generatedAudios.length > 0) {
      for (const audioItem of generatedAudios) {
        try {
          // Convert base64 to buffer
          const buffer = Buffer.from(audioItem.audioData, 'base64');
          const audioBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
          
          // Upload to S3
          const audioUrl = await s3Service.uploadAudioFile(
            audioBuffer,
            audioItem.fileName,
            'audio/mpeg'
          );
          
          // Update the corresponding track with the audio URL
          const trackIndex = audioItem.trackIndex;
          if (tracks[trackIndex]) {
            tracks[trackIndex].audioUrl = audioUrl;
          }
          
        } catch (uploadError: any) {
          console.error(`Failed to upload audio for track ${audioItem.trackIndex}:`, uploadError);
        }
      }
    }

    processedTracks.push(...tracks);

    // Save the audio mix to database
    const audioMixData = {
      userId,
      title: `Personalized Sleep Mix - ${persona}`,
      description: `Custom audio mix for ${chronotype} chronotype`,
      category: 'personalized_mix',
      tracks: processedTracks,
      chronotype,
      persona,
      soundPreferences,
      prompt: `Personalized sleep soundscape for ${persona} persona with ${chronotype} chronotype`
    };

    const savedAudio = await storage.createGeneratedAudio(audioMixData);

    return { 
      statusCode: 201, 
      headers, 
      body: JSON.stringify({ 
        audioMix: savedAudio,
        tracks: processedTracks 
      }) 
    };

  } catch (error: any) {
    console.error("Personalized audio processing failed:", error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        message: "Failed to process personalized audio mix",
        error: process.env.STAGE === 'dev' ? error.message : undefined
      }) 
    };
  }
}

// Add a new endpoint to get the ElevenLabs API key for frontend use
async function handleGetAudioConfig(params: any, body: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    // Only return the API key if it's properly configured
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenLabsApiKey) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Audio generation not configured" })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        elevenLabsApiKey,
        available: true
      })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: error.message })
    };
  }
}

// Helper function to get personalized audio recipe
function getPersonalizedAudioRecipe(
  chronotype: string, 
  persona: string, 
  preferences?: SoundPreferences
): AudioTrack[] {
  const AUDIO_TYPES = {
    PINK_NOISE: "Pink Noise",
    FOREST_SOUNDS: "Forest Sounds", 
    WHALE_SONGS: "Whale Songs",
    GENTLE_PIANO: "Gentle Piano",
    GUIDED_MEDITATION: "Guided Meditation",
    SLEEP_STORY: "Sleep Story",
    ASMR_TRIGGERS: "ASMR Triggers",
    DEEP_BREATHING: "Deep Breathing Pacer",
    BINAURAL_BEATS: "Binaural Beats",
    RAIN_ON_TENT: "Rain on a Tent"
  };

  const CHRONOTYPE_SOUNDS = {
    MORNING_BIRDS: "Morning Birds",
    CRICKETS: "Crickets", 
    DISTANT_THUNDER: "Distant Thunder",
    UNDERWATER: "Underwater"
  };

  const baseRecipes: Record<string, AudioTrack[]> = {
    "Stress Melter": [
      { type: AUDIO_TYPES.GUIDED_MEDITATION, weight: 0.5, duration: 600 },
      { type: AUDIO_TYPES.GENTLE_PIANO, weight: 0.3, duration: 1800 },
      { type: AUDIO_TYPES.RAIN_ON_TENT, weight: 0.2, duration: 3600 }
    ],
    "Mind Quieter": [
      { type: AUDIO_TYPES.SLEEP_STORY, weight: 0.6, duration: 900 },
      { type: AUDIO_TYPES.FOREST_SOUNDS, weight: 0.4, duration: 3600 }
    ],
    "Deep Sleeper": [
      { type: AUDIO_TYPES.PINK_NOISE, weight: 0.5, duration: 7200 },
      { type: AUDIO_TYPES.BINAURAL_BEATS, weight: 0.3, duration: 3600 },
      { type: AUDIO_TYPES.WHALE_SONGS, weight: 0.2, duration: 1800 }
    ]
  };

  const recipe = [...baseRecipes[persona as keyof typeof baseRecipes]];
  
  // Add chronotype-specific sounds
  const chronoAdjustments: Record<string, AudioTrack[]> = {
    Lion: [{ type: CHRONOTYPE_SOUNDS.MORNING_BIRDS, weight: 0.1, duration: 900 }],
    Bear: [{ type: CHRONOTYPE_SOUNDS.CRICKETS, weight: 0.1, duration: 1800 }],
    Wolf: [{ type: CHRONOTYPE_SOUNDS.DISTANT_THUNDER, weight: 0.1, duration: 1200 }],
    Dolphin: [{ type: CHRONOTYPE_SOUNDS.UNDERWATER, weight: 0.1, duration: 1800 }]
  };

  if (chronoAdjustments[chronotype]) {
    recipe.push(...chronoAdjustments[chronotype]);
  }

  // Apply user preferences
  if (preferences) {
    applyPreferences(recipe, preferences);
  }

  // Normalize weights
  const totalWeight = recipe.reduce((sum, track) => sum + track.weight, 0);
  return recipe.map(track => ({
    ...track,
    weight: track.weight / totalWeight
  }));
}

// Helper functions
function isVoiceBasedTrack(trackType: string): boolean {
  return trackType === "Guided Meditation" || trackType === "Sleep Story" || trackType === "Deep Breathing Pacer";
}

function getScriptForTrack(trackType: string, persona: string): string {
  const MEDITATION_SCRIPTS = {
    "Stress Melter": `Take a deep breath in... and slowly let it out. You are safe, you are calm, you are at peace. 
      Feel the tension leaving your shoulders with each exhale. Let go of the day's worries. 
      They have no place here in this moment of tranquility. Your body is becoming heavy and relaxed, 
      sinking into comfort. With each breath, you drift deeper into peaceful rest.`,
      
    "Mind Quieter": `Imagine your thoughts as leaves floating down a gentle stream. 
      Watch them drift by without judgment, without attachment. Some thoughts may try to pull you along, 
      but you remain on the peaceful shore, simply observing. The stream flows endlessly, 
      carrying away all the mental chatter of the day. You are the calm observer, 
      peaceful and still, ready for restful sleep.`,
      
    "Deep Sleeper": `Feel your body becoming wonderfully heavy, like you're sinking into the most comfortable bed. 
      Every muscle is releasing, every nerve is calming. You're entering the deepest, most restorative sleep. 
      Your breathing slows, your heartbeat steadies, and your mind becomes beautifully quiet. 
      This is your time for complete restoration and healing rest.`
  };

  if (trackType === "Guided Meditation") {
    return MEDITATION_SCRIPTS[persona as keyof typeof MEDITATION_SCRIPTS] || MEDITATION_SCRIPTS["Deep Sleeper"];
  } else if (trackType === "Sleep Story") {
    return `Once upon a time, in a peaceful meadow surrounded by gentle hills, 
      there stood an old oak tree. Its branches swayed softly in the evening breeze, 
      and beneath its canopy, the grass was soft and warm. 
      As twilight painted the sky in shades of purple and gold, 
      a sense of deep tranquility settled over the land. 
      The flowers closed their petals for the night, 
      and the world prepared for restful sleep. 
      You too can feel this peaceful energy, 
      letting it carry you gently into dreams...`;
  } else if (trackType === "Deep Breathing Pacer") {
    return `Breathe in slowly for four counts... two... three... four... 
      Now hold for four counts... two... three... four... 
      And breathe out slowly for six counts... two... three... four... five... six... 
      Continue this rhythm, letting each breath bring you deeper into relaxation...`;
  }
  
  return "Relax and let yourself drift into peaceful sleep...";
}

function getSoundPromptForTrack(trackType: string): string {
  const SOUND_PROMPTS: Record<string, string> = {
    "Pink Noise": "Gentle pink noise, soft continuous sound for deep sleep, muffled white noise with lower frequencies",
    "Forest Sounds": "Peaceful forest ambience with gentle rustling leaves, distant bird calls, soft wind through trees",
    "Whale Songs": "Calming whale songs, deep ocean sounds, distant whale calls echoing underwater",
    "Gentle Piano": "Soft, slow piano melody for relaxation, gentle keys, peaceful classical style",
    "ASMR Triggers": "Gentle tapping sounds, soft brushing, light scratching for ASMR relaxation",
    "Binaural Beats": "Delta wave binaural beats for deep sleep, low frequency healing tones",
    "Rain on a Tent": "Gentle rain falling on canvas tent, soft pattering, cozy camping sounds",
    "Morning Birds": "Gentle dawn chorus, soft bird songs, peaceful morning nature sounds",
    "Crickets": "Soft cricket chirping, evening nature sounds, gentle insect ambience",
    "Distant Thunder": "Soft distant thunder, gentle rumbling, peaceful storm ambience",
    "Underwater": "Gentle underwater sounds, soft bubbles, peaceful ocean depths"
  };

  return SOUND_PROMPTS[trackType] || "Peaceful ambient sounds for relaxation and sleep";
}

function applyPreferences(recipe: AudioTrack[], preferences: SoundPreferences): void {
  const preferenceMap: Record<string, keyof SoundPreferences> = {
    "Gentle Piano": 'gentleMusic',
    "Forest Sounds": 'natureSounds',
    "ASMR Triggers": 'whisperingVoice',
    "Pink Noise": 'whiteNoise'
  };

  recipe.forEach(track => {
    const prefKey = preferenceMap[track.type];
    if (prefKey && preferences[prefKey]) {
      switch (preferences[prefKey]) {
        case 'like':
          track.weight *= 1.3;
          break;
        case 'dislike':
          track.weight *= 0.5;
          break;
      }
    }
  });
}