interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
}

interface ElevenLabsResponse {
  audio: ArrayBuffer;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY || "";
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

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error("Error fetching voices:", error);
      return [];
    }
  }

  private async getOptimalVoiceForSleep(): Promise<string> {
    // Default to a calm, soothing voice ID (this is a real ElevenLabs voice ID for Sarah)
    // In production, you'd want to analyze user preferences and select accordingly
    return "EXAVITQu4vr4xnSDxMaL"; // Sarah's voice - known for calm delivery
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
