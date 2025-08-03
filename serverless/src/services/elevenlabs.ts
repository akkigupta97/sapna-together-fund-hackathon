// Update your existing elevenlabs.ts service with these additions

import { s3Service } from './s3';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || "";
    if (!this.apiKey) {
      console.warn("ElevenLabs API key not found. Audio generation will be disabled.");
    }
  }

  async generateAudio(text: string, voiceId?: string): Promise<ArrayBuffer | null> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API key not configured");
    }

    const selectedVoiceId = voiceId || await this.getOptimalVoiceForSleep();

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${selectedVoiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.8,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: false
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error generating audio with ElevenLabs:", error);
      throw error;
    }
  }

  // NEW: Generate sound effects using ElevenLabs Sound Generation API
  async generateSoundEffect(
    prompt: string, 
    duration: number = 30,
    outputFormat: 'mp3' | 'wav' = 'mp3'
  ): Promise<ArrayBuffer | null> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API key not configured");
    }

    try {
      const response = await fetch(`${this.baseUrl}/sound-generation`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: prompt,
          duration_seconds: Math.min(duration, 22), // ElevenLabs limit is 22 seconds
          prompt_influence: 0.3,
          output_format: outputFormat
        })
      });

      if (!response.ok) {
        console.error(`ElevenLabs Sound Generation API error: ${response.status} ${response.statusText}`);
        const errorBody = await response.text();
        console.error('Error response body:', errorBody);
        throw new Error(`ElevenLabs Sound Generation API error: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error generating sound effect:', error);
      throw error;
    }
  }

  // NEW: Generate and upload sound effect
  async generateAndUploadSoundEffect(
    prompt: string,
    fileName: string,
    duration: number = 30
  ): Promise<string> {
    try {
      // For longer durations, we'll need to loop or generate multiple segments
      // ElevenLabs has a 22-second limit, so we'll generate the base sound
      const audioBuffer = await this.generateSoundEffect(prompt, Math.min(duration, 22));
      
      if (!audioBuffer) {
        throw new Error("Failed to generate sound effect");
      }

      // Upload to S3 and return the URL
      const audioUrl = await s3Service.uploadAudioFile(
        audioBuffer,
        `${fileName}.mp3`,
        'audio/mpeg'
      );

      return audioUrl;
    } catch (error) {
      console.error("Error generating and uploading sound effect:", error);
      throw error;
    }
  }

  async generateAndUploadAudio(
    text: string, 
    fileName: string,
    voiceId?: string
  ): Promise<string> {
    try {
      // Generate audio
      const audioBuffer = await this.generateAudio(text, voiceId);
      
      if (!audioBuffer) {
        throw new Error("Failed to generate audio");
      }

      // Upload to S3 and return the URL
      const audioUrl = await s3Service.uploadAudioFile(
        audioBuffer,
        `${fileName}.mp3`,
        'audio/mpeg'
      );

      return audioUrl;
    } catch (error) {
      console.error("Error generating and uploading audio:", error);
      throw error;
    }
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data: any = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error("Error fetching voices:", error);
      return [];
    }
  }

  private async getOptimalVoiceForSleep(): Promise<string> {
    // Default to a calm, soothing voice ID for sleep content
    return "pNInz6obpgDQGcFmaJgB"; // Calm, soothing voice for meditation
  }

  // Updated to handle different voice types based on content
  async getVoiceForContent(contentType: string): Promise<string> {
    switch (contentType) {
      case "Guided Meditation":
        return "pNInz6obpgDQGcFmaJgB"; // Very calm and stable
      case "Sleep Story":
        return "EXAVITQu4vr4xnSDxMaL"; // Storytelling voice
      case "Deep Breathing Pacer":
        return "pNInz6obpgDQGcFmaJgB"; // Calm guidance
      default:
        return "pNInz6obpgDQGcFmaJgB";
    }
  }

  generateSleepPrompt(
    category: string, 
    preferences: string[], 
    duration: number, 
    environment: string
  ): string {
    const prompts = {
      nature: [
        "Gentle rain falling on leaves in a peaceful forest",
        "Soft ocean waves lapping against a quiet shore", 
        "Wind rustling through tall grass in a meadow",
        "A bubbling creek flowing over smooth stones",
        "Birds singing softly at dawn in a tranquil garden"
      ],
      white_noise: [
        "Consistent, soft white noise for deep relaxation",
        "Gentle pink noise to mask distracting sounds",
        "Steady brown noise for grounding and calm",
        "Soft fan-like sounds for comfortable sleep"
      ],
      asmr: [
        "Gentle whispering with soft breathing sounds",
        "Light tapping on wooden surfaces",
        "Soft brushing sounds for relaxation",
        "Page turning with gentle paper sounds"
      ],
      ambient: [
        "Ethereal drones and soft harmonics",
        "Gentle synthesized tones for deep meditation",
        "Warm, enveloping ambient soundscape",
        "Soft celestial tones with gentle reverb"
      ]
    };

    const categoryPrompts = prompts[category as keyof typeof prompts] || prompts.nature;
    const basePrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
    
    let environmentContext = "";
    if (environment === "city") {
      environmentContext = " designed to mask urban noise";
    } else if (environment === "quiet") {
      environmentContext = " for a naturally quiet environment";
    }

    return `Create a ${duration}-minute sleep audio featuring ${basePrompt}${environmentContext}. The audio should be calming, repetitive, and designed to help someone fall asleep peacefully.`;
  }
}

export const elevenLabsService = new ElevenLabsService();
