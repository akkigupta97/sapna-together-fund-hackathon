interface AudioTrack {
  type: string;
  weight: number;
  duration?: number;
  audioUrl?: string;
}

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

export class FrontendAudioService {
  private gradioEndpoint: string;

  constructor(gradioEndpoint: string = "https://04498bebb8fed7557c.gradio.live") {
    this.gradioEndpoint = gradioEndpoint;
  }

  private async callGradioAPI(textDescription: string): Promise<string | null> {
    try {
      console.log(`Calling Gradio API at: ${this.gradioEndpoint}`);
      console.log(`Text description: ${textDescription}`);

      // Try the direct API approach first
      const response = await fetch(`${this.gradioEndpoint}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [textDescription],
          fn_index: 0, // Assuming generate_and_upload_audio is the first/only function
        }),
      });

      if (!response.ok) {
        console.error(`Gradio API response not ok: ${response.status} ${response.statusText}`);
        throw new Error(`Gradio API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Gradio API result:", result);

      // Handle different response formats
      if (result.data && Array.isArray(result.data) && result.data[0]) {
        // If it's a file path, convert to full URL
        const audioPath = result.data[0];
        if (typeof audioPath === 'string') {
          // If it's already a full URL, return as is
          if (audioPath.startsWith('http')) {
            return audioPath;
          }
          // If it's a relative path, make it absolute
          return `${this.gradioEndpoint}/file=${audioPath}`;
        }
      }

      return null;
    } catch (error) {
      console.error('Direct API call failed, trying alternative approach:', error);
      
      // Fallback: Try to use the gradio_client if available
      try {
        // Check if @gradio/client is available
        if (typeof window !== 'undefined' && (window as any).gradio_client) {
          const { Client } = (window as any).gradio_client;
          const client = await Client.connect(this.gradioEndpoint);
          
          const result = await client.predict("/generate_and_upload_audio", {
            text_description: textDescription
          });

          console.log("Gradio client result:", result);

          if (result && result.data && result.data[0]) {
            return result.data[0];
          }
        }
      } catch (clientError) {
        console.error('Gradio client also failed:', clientError);
      }

      throw error;
    }
  }

  async generateAudio(text: string, voiceId?: string): Promise<string | null> {
    try {
      // Create descriptive prompt for the Gradio service
      const prompt = this.createAudioPrompt(text, voiceId);
      const result = await this.callGradioAPI(prompt);

      return result;
    } catch (error) {
      console.error("Error generating audio with Gradio:", error);
      throw error;
    }
  }

  async generateSoundEffect(
    prompt: string, 
    duration: number = 30,
    outputFormat: 'mp3' | 'wav' = 'mp3'
  ): Promise<string | null> {
    try {
      // Enhanced prompt with duration and format
      const enhancedPrompt = `${prompt}. Duration: ${duration} seconds. Output format: ${outputFormat}`;
      const result = await this.callGradioAPI(enhancedPrompt);

      return result;
    } catch (error) {
      console.error('Error generating sound effect:', error);
      throw error;
    }
  }

  private createAudioPrompt(text: string, voiceId?: string): string {
    const voiceDescription = this.getVoiceDescription(voiceId);
    return `Create a ${voiceDescription} audio recording of someone speaking the following text in a calm, soothing voice: "${text}"`;
  }

  private getVoiceDescription(voiceId?: string): string {
    const voiceDescriptions: Record<string, string> = {
      "meditation": "calm and meditative",
      "storytelling": "gentle storytelling",
      "breathing-guide": "peaceful breathing guidance",
    };

    return voiceDescriptions[voiceId || "meditation"] || "calm and soothing";
  }

  getVoiceForContent(contentType: string): string {
    switch (contentType) {
      case "Guided Meditation":
        return "meditation";
      case "Sleep Story":
        return "storytelling";
      case "Deep Breathing Pacer":
        return "breathing-guide";
      default:
        return "meditation";
    }
  }

  // Generate personalized audio recipe
  getPersonalizedAudioRecipe(
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
      this.applyPreferences(recipe, preferences);
    }

    // Normalize weights
    const totalWeight = recipe.reduce((sum, track) => sum + track.weight, 0);
    return recipe.map(track => ({
      ...track,
      weight: track.weight / totalWeight
    }));
  }

  private applyPreferences(recipe: AudioTrack[], preferences: SoundPreferences): void {
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

  isVoiceBasedTrack(trackType: string): boolean {
    return trackType === "Guided Meditation" || trackType === "Sleep Story" || trackType === "Deep Breathing Pacer";
  }

  getScriptForTrack(trackType: string, persona: string): string {
    const MEDITATION_SCRIPTS = {
      "Stress Melter": "Take a deep breath in and slowly let it out. You are safe, you are calm, you are at peace. Feel the tension leaving your shoulders with each exhale. Let go of the day's worries. They have no place here in this moment of tranquility. Your body is becoming heavy and relaxed, sinking into comfort. With each breath, you drift deeper into peaceful rest.",
        
      "Mind Quieter": "Imagine your thoughts as leaves floating down a gentle stream. Watch them drift by without judgment, without attachment. Some thoughts may try to pull you along, but you remain on the peaceful shore, simply observing. The stream flows endlessly, carrying away all the mental chatter of the day. You are the calm observer, peaceful and still, ready for restful sleep.",
        
      "Deep Sleeper": "Feel your body becoming wonderfully heavy, like you're sinking into the most comfortable bed. Every muscle is releasing, every nerve is calming. You're entering the deepest, most restorative sleep. Your breathing slows, your heartbeat steadies, and your mind becomes beautifully quiet. This is your time for complete restoration and healing rest."
    };

    if (trackType === "Guided Meditation") {
      return MEDITATION_SCRIPTS[persona as keyof typeof MEDITATION_SCRIPTS] || MEDITATION_SCRIPTS["Deep Sleeper"];
    } else if (trackType === "Sleep Story") {
      return "Once upon a time, in a peaceful meadow surrounded by gentle hills, there stood an old oak tree. Its branches swayed softly in the evening breeze, and beneath its canopy, the grass was soft and warm. As twilight painted the sky in shades of purple and gold, a sense of deep tranquility settled over the land. The flowers closed their petals for the night, and the world prepared for restful sleep. You too can feel this peaceful energy, letting it carry you gently into dreams.";
    } else if (trackType === "Deep Breathing Pacer") {
      return "Breathe in slowly for four counts, two, three, four. Now hold for four counts, two, three, four. And breathe out slowly for six counts, two, three, four, five, six. Continue this rhythm, letting each breath bring you deeper into relaxation.";
    }
    
    return "Relax and let yourself drift into peaceful sleep.";
  }

  getSoundPromptForTrack(trackType: string): string {
    const SOUND_PROMPTS: Record<string, string> = {
      "Pink Noise": "Generate continuous pink noise audio, soft background sound with lower frequencies that's perfect for deep sleep and relaxation",
      "Forest Sounds": "Create peaceful forest ambience with gentle rustling leaves, distant bird calls, and soft wind through trees for relaxation",
      "Whale Songs": "Generate calming whale songs with deep ocean sounds and distant whale calls echoing underwater for meditation",
      "Gentle Piano": "Create soft, slow piano melody for relaxation with gentle keys and peaceful classical style music",
      "ASMR Triggers": "Generate gentle ASMR sounds including soft tapping, light brushing, and whispered sounds for relaxation",
      "Binaural Beats": "Create delta wave binaural beats for deep sleep with low frequency healing tones",
      "Rain on a Tent": "Generate gentle rain falling on canvas tent with soft pattering and cozy camping atmosphere",
      "Morning Birds": "Create gentle dawn chorus with soft bird songs and peaceful morning nature sounds",
      "Crickets": "Generate soft cricket chirping with evening nature sounds and gentle insect ambience",
      "Distant Thunder": "Create soft distant thunder with gentle rumbling and peaceful storm ambience",
      "Underwater": "Generate gentle underwater sounds with soft bubbles and peaceful ocean depths ambience"
    };

    return SOUND_PROMPTS[trackType] || "Generate peaceful ambient sounds for relaxation and sleep";
  }

  // Generate and process audio tracks
  async generatePersonalizedAudio(
    userId: string,
    chronotype: string,
    persona: string,  
    preferences?: SoundPreferences,
    onProgress?: (progress: number, message: string) => void
  ): Promise<{ tracks: AudioTrack[], generatedAudios: { trackIndex: number, audioUrl: string, fileName: string }[] }> {
    const recipe = this.getPersonalizedAudioRecipe(chronotype, persona, preferences);
    const generatedAudios: { trackIndex: number, audioUrl: string, fileName: string }[] = [];
    
    onProgress?.(10, "Generated audio recipe");

    // Generate audio for each track
    for (let i = 0; i < recipe.length; i++) {
      const track = recipe[i];
      const progressBase = 10 + (i / recipe.length) * 80;
      
      onProgress?.(progressBase, `Generating ${track.type}...`);
      
      try {
        let audioUrl: string | null = null;
        const fileName = `${track.type.toLowerCase().replace(/\s+/g, '-')}-${userId}-${Date.now()}-${i}`;
        
        if (this.isVoiceBasedTrack(track.type)) {
          // Generate speech-based audio
          const script = this.getScriptForTrack(track.type, persona);
          const voiceType = this.getVoiceForContent(track.type);
          audioUrl = await this.generateAudio(script, voiceType);
        } else {
          // Generate sound effect audio
          const prompt = this.getSoundPromptForTrack(track.type);
          audioUrl = await this.generateSoundEffect(prompt, track.duration || 300);
        }
        
        if (audioUrl) {
          generatedAudios.push({
            trackIndex: i,
            audioUrl,
            fileName: `${fileName}.mp3`
          });
          
          onProgress?.(progressBase + (80 / recipe.length), `Generated ${track.type}`);
        }
        
      } catch (error) {
        console.error(`Failed to generate audio for ${track.type}:`, error);
        onProgress?.(progressBase + (80 / recipe.length), `Failed to generate ${track.type}, continuing...`);
      }
    }

    onProgress?.(90, "Audio generation complete");
    
    return { tracks: recipe, generatedAudios };
  }

  // Helper method to test Gradio connection
  async testConnection(): Promise<boolean> {
    try {
      console.log(`Testing connection to: ${this.gradioEndpoint}`);
      
      // First, try to reach the Gradio app info endpoint
      const infoResponse = await fetch(`${this.gradioEndpoint}/info`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (infoResponse.ok) {
        const info = await infoResponse.json();
        console.log("Gradio app info:", info);
        
        // Now try a simple prediction
        const testResult = await this.callGradioAPI("Test connection - generate a short hello sound");
        console.log("Test connection result:", testResult);
        return testResult !== null;
      } else {
        console.error(`Gradio info endpoint failed: ${infoResponse.status}`);
        return false;
      }
    } catch (error) {
      console.error("Gradio connection test failed:", error);
      return false;
    }
  }

  // Method to check if Gradio service is available
  async checkServiceHealth(): Promise<{ isHealthy: boolean; message: string }> {
    try {
      // First check if the endpoint is reachable
      console.log(`Checking health of: ${this.gradioEndpoint}`);
      
      const healthResponse = await fetch(this.gradioEndpoint, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (!healthResponse.ok) {
        return {
          isHealthy: false,
          message: `Gradio service returned ${healthResponse.status}: ${healthResponse.statusText}`
        };
      }
      
      // Try to get app info
      try {
        const infoResponse = await fetch(`${this.gradioEndpoint}/info`);
        if (infoResponse.ok) {
          const info = await infoResponse.json();
          console.log("Gradio service info:", info);
          
          return {
            isHealthy: true,
            message: `Gradio service is running. Functions available: ${info.named_endpoints ? Object.keys(info.named_endpoints).join(', ') : 'Unknown'}`
          };
        }
      } catch (infoError) {
        console.warn("Could not get Gradio info, but service is reachable:", infoError);
      }
      
      return {
        isHealthy: true,
        message: "Gradio service is reachable and responding"
      };
      
    } catch (error) {
      console.error("Service health check failed:", error);
      
      return {
        isHealthy: false,
        message: `Failed to connect to Gradio service: ${error instanceof Error ? error.message : 'Unknown error'}. Please check if the service is running at ${this.gradioEndpoint}`
      };
    }
  }
}

export default FrontendAudioService;
